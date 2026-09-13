package store

import (
	"context"
	"errors"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

func supplyFixture(t *testing.T) (*Store, SupplyOffer, string) {
	t.Helper()
	s, e := Open(filepath.Join(t.TempDir(), "supply.db"))
	if e != nil {
		t.Fatal(e)
	}
	t.Cleanup(func() { s.Close() })
	o, key, e := s.CreateSupply(context.Background(), SupplyOffer{Model: "m", Providers: []string{"p"}, StartsAt: time.Now().Add(-time.Minute), EndsAt: time.Now().Add(time.Hour), Concurrency: 1, RPM: 5, RequestBudget: 3})
	if e != nil {
		t.Fatal(e)
	}
	return s, o, key
}
func TestSupplyAdmissionWithdrawalAndIsolation(t *testing.T) {
	s, o, key := supplyFixture(t)
	ctx := context.Background()
	if _, e := s.AdmitSupply(ctx, o.ID, key, "draft"); !errors.Is(e, ErrSupplyDenied) {
		t.Fatal(e)
	}
	if e := s.TransitionSupply(ctx, o.ID, "publish"); e != nil {
		t.Fatal(e)
	}
	if _, e := s.AdmitSupply(ctx, o.ID, "private-key", "wrong"); !errors.Is(e, ErrSupplyDenied) {
		t.Fatal(e)
	}
	if _, e := s.AdmitSupply(ctx, o.ID, key, "one"); e != nil {
		t.Fatal(e)
	}
	if _, e := s.AdmitSupply(ctx, o.ID, key, "one"); !errors.Is(e, ErrSupplyDuplicate) {
		t.Fatal(e)
	}
	if _, e := s.AdmitSupply(ctx, o.ID, key, "two"); !errors.Is(e, ErrSupplyLimit) {
		t.Fatal(e)
	}
	if e := s.TransitionSupply(ctx, o.ID, "withdraw"); e != nil {
		t.Fatal(e)
	}
	v, _ := s.Supply(ctx, o.ID)
	if v.State != "draining" {
		t.Fatal(v.State)
	}
	if _, e := s.AdmitSupply(ctx, o.ID, key, "new"); !errors.Is(e, ErrSupplyDenied) {
		t.Fatal(e)
	}
	if e := s.FinishSupply(ctx, o.ID, "one", "completed", 200); e != nil {
		t.Fatal(e)
	}
	v, _ = s.Supply(ctx, o.ID)
	if v.State != "withdrawn" {
		t.Fatal(v.State)
	}
}
func TestSupplyConcurrentAdmissionAndRestartAccounting(t *testing.T) {
	s, o, key := supplyFixture(t)
	ctx := context.Background()
	if e := s.TransitionSupply(ctx, o.ID, "publish"); e != nil {
		t.Fatal(e)
	}
	var wg sync.WaitGroup
	var mu sync.Mutex
	admitted := []string{}
	for _, id := range []string{"a", "b", "c", "d"} {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			if _, e := s.AdmitSupply(ctx, o.ID, key, id); e == nil {
				mu.Lock()
				admitted = append(admitted, id)
				mu.Unlock()
			}
		}(id)
	}
	wg.Wait()
	if len(admitted) != 1 {
		t.Fatal(admitted)
	}
	if e := s.RecoverSupply(ctx); e != nil {
		t.Fatal(e)
	}
	if _, e := s.AdmitSupply(ctx, o.ID, key, "after-restart"); !errors.Is(e, ErrSupplyLimit) {
		t.Fatal(e)
	}
	receipts, _ := s.SupplyReceipts(ctx, o.ID)
	if receipts[0].State != "unknown" {
		t.Fatal(receipts)
	}
	if e := s.TransitionSupply(ctx, o.ID, "withdraw"); e != nil {
		t.Fatal(e)
	}
	if e := s.ReconcileSupply(ctx, o.ID, admitted[0]); e != nil {
		t.Fatal(e)
	}
	v, _ := s.Supply(ctx, o.ID)
	if v.State != "withdrawn" {
		t.Fatal(v.State)
	}
}
func TestSupplyDisconnectRotationBudgetAndReservation(t *testing.T) {
	s, o, key := supplyFixture(t)
	ctx := context.Background()
	if e := s.TransitionSupply(ctx, o.ID, "publish"); e != nil {
		t.Fatal(e)
	}
	other, _, e := s.CreateSupply(ctx, o)
	if e != nil {
		t.Fatal(e)
	}
	if e = s.TransitionSupply(ctx, other.ID, "publish"); e == nil {
		t.Fatal("shared endpoint reservation accepted")
	}
	if e = s.DisconnectSupply(ctx, true); e != nil {
		t.Fatal(e)
	}
	if _, e = s.AdmitSupply(ctx, o.ID, key, "offline"); !errors.Is(e, ErrSupplyDenied) {
		t.Fatal(e)
	}
	if e = s.DisconnectSupply(ctx, false); e != nil {
		t.Fatal(e)
	}
	rotated, e := s.RotateSupplyKey(ctx, o.ID)
	if e != nil {
		t.Fatal(e)
	}
	if _, e = s.AdmitSupply(ctx, o.ID, key, "old-key"); !errors.Is(e, ErrSupplyDenied) {
		t.Fatal(e)
	}
	for _, id := range []string{"a", "b", "c"} {
		if _, e = s.AdmitSupply(ctx, o.ID, rotated, id); e != nil {
			t.Fatal(e)
		}
		if e = s.FinishSupply(ctx, o.ID, id, "completed", 200); e != nil {
			t.Fatal(e)
		}
	}
	if _, e = s.AdmitSupply(ctx, o.ID, rotated, "over-budget"); !errors.Is(e, ErrSupplyLimit) {
		t.Fatal(e)
	}
}
func TestSupplyWindowAndRate(t *testing.T) {
	s, o, _ := supplyFixture(t)
	ctx := context.Background()
	o.StartsAt = time.Now().Add(time.Hour)
	o.EndsAt = time.Now().Add(2 * time.Hour)
	future, key, e := s.CreateSupply(ctx, o)
	if e != nil {
		t.Fatal(e)
	}
	if e = s.TransitionSupply(ctx, future.ID, "publish"); e != nil {
		t.Fatal(e)
	}
	if _, e = s.AdmitSupply(ctx, future.ID, key, "early"); !errors.Is(e, ErrSupplyDenied) {
		t.Fatal(e)
	}
	if e = s.TransitionSupply(ctx, future.ID, "withdraw"); e != nil {
		t.Fatal(e)
	}
	o.RPM = 1
	o.StartsAt = time.Now().Add(-time.Hour)
	o.EndsAt = time.Now().Add(time.Hour)
	limited, key, e := s.CreateSupply(ctx, o)
	if e != nil {
		t.Fatal(e)
	}
	if e = s.TransitionSupply(ctx, limited.ID, "publish"); e != nil {
		t.Fatal(e)
	}
	if _, e = s.AdmitSupply(ctx, limited.ID, key, "one"); e != nil {
		t.Fatal(e)
	}
	if e = s.FinishSupply(ctx, limited.ID, "one", "completed", 200); e != nil {
		t.Fatal(e)
	}
	if _, e = s.AdmitSupply(ctx, limited.ID, key, "two"); !errors.Is(e, ErrSupplyLimit) {
		t.Fatal(e)
	}
}

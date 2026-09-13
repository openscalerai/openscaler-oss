package store

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

var ErrSupplyDenied = errors.New("publication is unavailable or its credential is invalid")
var ErrSupplyLimit = errors.New("publication capacity or request budget exhausted")
var ErrSupplyDuplicate = errors.New("request already admitted; inspect its receipt before retrying")

type SupplyOffer struct {
	ID            string            `json:"id"`
	Model         string            `json:"model"`
	Providers     []string          `json:"providers"`
	Capabilities  []string          `json:"capabilities"`
	Region        string            `json:"region"`
	Operator      string            `json:"operator"`
	Evidence      string            `json:"authorization_evidence"`
	PublicURL     string            `json:"public_url"`
	StartsAt      time.Time         `json:"starts_at"`
	EndsAt        time.Time         `json:"ends_at"`
	Concurrency   int               `json:"concurrency"`
	RPM           int               `json:"rpm"`
	RequestBudget int               `json:"request_budget"`
	InputPrice    float64           `json:"input_per_million"`
	OutputPrice   float64           `json:"output_per_million"`
	Fingerprints  map[string]string `json:"endpoint_fingerprints"`
	State         string            `json:"state"`
	CreatedAt     time.Time         `json:"created_at"`
}
type SupplyReceipt struct {
	ID         string `json:"id"`
	OfferID    string `json:"offer_id"`
	State      string `json:"state"`
	Status     int    `json:"status"`
	StartedAt  int64  `json:"started_at"`
	FinishedAt int64  `json:"finished_at"`
}

func supplyID() string {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}
func supplyHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
func (s *Store) initSupply(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS supply_offers(id TEXT PRIMARY KEY, spec TEXT NOT NULL, token_hash TEXT NOT NULL, state TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS supply_receipts(offer_id TEXT NOT NULL, id TEXT NOT NULL, state TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 0, started_at INTEGER NOT NULL, finished_at INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(offer_id,id));
 CREATE INDEX IF NOT EXISTS supply_receipts_started ON supply_receipts(offer_id,started_at);
 CREATE TABLE IF NOT EXISTS supply_attempts(offer_id TEXT NOT NULL, request_id TEXT NOT NULL, attempt INTEGER NOT NULL, provider TEXT NOT NULL, state TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(offer_id,request_id,attempt));
 CREATE TABLE IF NOT EXISTS supply_control(id INTEGER PRIMARY KEY CHECK(id=1), disconnected INTEGER NOT NULL);
 INSERT OR IGNORE INTO supply_control VALUES(1,0);`)
	return err
}
func (s *Store) CreateSupply(ctx context.Context, offer SupplyOffer) (SupplyOffer, string, error) {
	offer.ID = supplyID()
	offer.State = "draft"
	offer.CreatedAt = time.Now().UTC()
	token := "osc_supply_" + supplyID()
	body, err := json.Marshal(offer)
	if err != nil {
		return offer, "", err
	}
	_, err = s.db.ExecContext(ctx, "INSERT INTO supply_offers VALUES(?,?,?,?)", offer.ID, string(body), supplyHash(token), offer.State)
	return offer, token, err
}
func scanSupply(row interface{ Scan(...any) error }) (SupplyOffer, error) {
	var body, state string
	var offer SupplyOffer
	err := row.Scan(&body, &state)
	if err != nil {
		return offer, err
	}
	err = json.Unmarshal([]byte(body), &offer)
	offer.State = state
	return offer, err
}
func (s *Store) Supply(ctx context.Context, id string) (SupplyOffer, error) {
	return scanSupply(s.db.QueryRowContext(ctx, "SELECT spec,state FROM supply_offers WHERE id=?", id))
}
func (s *Store) Supplies(ctx context.Context) ([]SupplyOffer, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT spec,state FROM supply_offers ORDER BY rowid DESC LIMIT 200")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SupplyOffer{}
	for rows.Next() {
		o, e := scanSupply(rows)
		if e != nil {
			return nil, e
		}
		out = append(out, o)
	}
	return out, rows.Err()
}
func (s *Store) TransitionSupply(ctx context.Context, id, action string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	o, err := scanSupply(tx.QueryRowContext(ctx, "SELECT spec,state FROM supply_offers WHERE id=?", id))
	if err != nil {
		return err
	}
	state := ""
	switch action {
	case "publish":
		if o.State != "draft" || !time.Now().Before(o.EndsAt) {
			return errors.New("only an unexpired draft can be published")
		}
		var disconnected int
		if err = tx.QueryRowContext(ctx, "SELECT disconnected FROM supply_control WHERE id=1").Scan(&disconnected); err != nil {
			return err
		}
		if disconnected != 0 {
			return errors.New("connector is disconnected")
		}
		rows, e := tx.QueryContext(ctx, "SELECT spec,state FROM supply_offers WHERE state IN ('active','draining')")
		if e != nil {
			return e
		}
		for rows.Next() {
			other, e := scanSupply(rows)
			if e != nil {
				rows.Close()
				return e
			}
			for _, a := range o.Providers {
				for _, b := range other.Providers {
					if a == b {
						rows.Close()
						return errors.New("endpoint is already reserved by another publication")
					}
				}
			}
		}
		e = rows.Err()
		rows.Close()
		if e != nil {
			return e
		}
		state = "active"
	case "withdraw":
		if o.State == "withdrawn" {
			return nil
		}
		state = "withdrawn"
		var n int
		if err = tx.QueryRowContext(ctx, "SELECT count(*) FROM supply_receipts WHERE offer_id=? AND state IN ('running','unknown')", id).Scan(&n); err != nil {
			return err
		}
		if n > 0 {
			state = "draining"
		}
	default:
		return errors.New("unsupported transition")
	}
	_, err = tx.ExecContext(ctx, "UPDATE supply_offers SET state=? WHERE id=?", state, id)
	if err != nil {
		return err
	}
	return tx.Commit()
}
func (s *Store) SupplyDisconnected(ctx context.Context) (bool, error) {
	var n int
	err := s.db.QueryRowContext(ctx, "SELECT disconnected FROM supply_control WHERE id=1").Scan(&n)
	return n != 0, err
}
func (s *Store) DisconnectSupply(ctx context.Context, disconnected bool) error {
	_, err := s.db.ExecContext(ctx, "UPDATE supply_control SET disconnected=? WHERE id=1", disconnected)
	return err
}
func (s *Store) AdmitSupply(ctx context.Context, id, token, request string) (SupplyOffer, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return SupplyOffer{}, err
	}
	defer tx.Rollback()
	o, err := scanSupply(tx.QueryRowContext(ctx, "SELECT spec,state FROM supply_offers WHERE id=? AND token_hash=?", id, supplyHash(token)))
	if err != nil {
		return o, ErrSupplyDenied
	}
	var disconnected int
	if err = tx.QueryRowContext(ctx, "SELECT disconnected FROM supply_control WHERE id=1").Scan(&disconnected); err != nil {
		return o, err
	}
	now := time.Now()
	if disconnected != 0 || o.State != "active" || now.Before(o.StartsAt) || !now.Before(o.EndsAt) {
		return o, ErrSupplyDenied
	}
	var n int
	if err = tx.QueryRowContext(ctx, "SELECT count(*) FROM supply_receipts WHERE offer_id=? AND id=?", id, request).Scan(&n); err != nil {
		return o, err
	}
	if n > 0 {
		return o, ErrSupplyDuplicate
	}
	var running, recent, total int
	err = tx.QueryRowContext(ctx, `SELECT count(*),coalesce(sum(CASE WHEN state IN ('running','unknown') THEN 1 ELSE 0 END),0),coalesce(sum(CASE WHEN started_at>? THEN 1 ELSE 0 END),0) FROM supply_receipts WHERE offer_id=?`, now.Add(-time.Minute).UnixMilli(), id).Scan(&total, &running, &recent)
	if err != nil {
		return o, err
	}
	if total >= o.RequestBudget || running >= o.Concurrency || recent >= o.RPM {
		return o, ErrSupplyLimit
	}
	_, err = tx.ExecContext(ctx, "INSERT INTO supply_receipts(offer_id,id,state,started_at) VALUES(?,?,'running',?)", id, request, now.UnixMilli())
	if err != nil {
		return o, err
	}
	return o, tx.Commit()
}
func (s *Store) FinishSupply(ctx context.Context, id, request, state string, status int) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(ctx, "UPDATE supply_receipts SET state=?,status=?,finished_at=? WHERE offer_id=? AND id=? AND state='running'", state, status, time.Now().UnixMilli(), id, request)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `UPDATE supply_offers SET state='withdrawn' WHERE id=? AND state='draining' AND NOT EXISTS(SELECT 1 FROM supply_receipts WHERE offer_id=? AND state IN ('running','unknown'))`, id, id)
	if err != nil {
		return err
	}
	return tx.Commit()
}

// Recovery preserves uncertain work as occupied capacity. No automatic retry or billing conclusion.
func (s *Store) RecoverSupply(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, "UPDATE supply_attempts SET state='unknown' WHERE state IN ('running','response_headers'); UPDATE supply_receipts SET state='unknown' WHERE state='running'")
	return err
}
func (s *Store) ReconcileSupply(ctx context.Context, id, request string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	result, err := tx.ExecContext(ctx, "UPDATE supply_receipts SET state='reconciled',finished_at=? WHERE offer_id=? AND id=? AND state='unknown'", time.Now().UnixMilli(), id, request)
	if err != nil {
		return err
	}
	n, _ := result.RowsAffected()
	if n != 1 {
		return fmt.Errorf("only recovered unknown requests can be reconciled")
	}
	_, err = tx.ExecContext(ctx, `UPDATE supply_offers SET state='withdrawn' WHERE id=? AND state='draining' AND NOT EXISTS(SELECT 1 FROM supply_receipts WHERE offer_id=? AND state IN ('running','unknown'))`, id, id)
	if err != nil {
		return err
	}
	return tx.Commit()
}
func (s *Store) SupplyReceipts(ctx context.Context, id string) ([]SupplyReceipt, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT id,offer_id,state,status,started_at,finished_at FROM supply_receipts WHERE offer_id=? ORDER BY started_at DESC LIMIT 200", id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SupplyReceipt{}
	for rows.Next() {
		var r SupplyReceipt
		if err = rows.Scan(&r.ID, &r.OfferID, &r.State, &r.Status, &r.StartedAt, &r.FinishedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
func (s *Store) ReservedSupplyProviders(ctx context.Context) (map[string]bool, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT spec,state FROM supply_offers WHERE state IN ('active','draining')")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]bool{}
	for rows.Next() {
		o, e := scanSupply(rows)
		if e != nil {
			return nil, e
		}
		for _, id := range o.Providers {
			out[id] = true
		}
	}
	return out, rows.Err()
}

func (s *Store) RotateSupplyKey(ctx context.Context, id string) (string, error) {
	token := "osc_supply_" + supplyID()
	result, err := s.db.ExecContext(ctx, "UPDATE supply_offers SET token_hash=? WHERE id=? AND state IN ('draft','active')", supplyHash(token), id)
	if err != nil {
		return "", err
	}
	n, _ := result.RowsAffected()
	if n != 1 {
		return "", errors.New("only draft or active credentials can be rotated")
	}
	return token, nil
}

func (s *Store) CheckSupply(ctx context.Context, id, token string) (SupplyOffer, error) {
	o, err := scanSupply(s.db.QueryRowContext(ctx, "SELECT spec,state FROM supply_offers WHERE id=? AND token_hash=? AND (SELECT disconnected FROM supply_control WHERE id=1)=0", id, supplyHash(token)))
	if err != nil {
		return o, ErrSupplyDenied
	}
	now := time.Now()
	if o.State != "active" || now.Before(o.StartsAt) || !now.Before(o.EndsAt) {
		return o, ErrSupplyDenied
	}
	return o, nil
}

type SupplyAttempt struct {
	Attempt  int    `json:"attempt"`
	Provider string `json:"provider"`
	State    string `json:"state"`
	Status   int    `json:"status"`
}

func (s *Store) BeginSupplyAttempt(ctx context.Context, id, request string, attempt int, provider string) error {
	_, err := s.db.ExecContext(ctx, "INSERT INTO supply_attempts(offer_id,request_id,attempt,provider,state) VALUES(?,?,?,?,'running')", id, request, attempt, provider)
	return err
}
func (s *Store) FinishSupplyAttempt(ctx context.Context, id, request string, attempt int, state string, status int) error {
	_, err := s.db.ExecContext(ctx, "UPDATE supply_attempts SET state=?,status=? WHERE offer_id=? AND request_id=? AND attempt=?", state, status, id, request, attempt)
	return err
}
func (s *Store) SupplyAttempts(ctx context.Context, id, request string) ([]SupplyAttempt, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT attempt,provider,state,status FROM supply_attempts WHERE offer_id=? AND request_id=? ORDER BY attempt", id, request)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SupplyAttempt{}
	for rows.Next() {
		var a SupplyAttempt
		if err = rows.Scan(&a.Attempt, &a.Provider, &a.State, &a.Status); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

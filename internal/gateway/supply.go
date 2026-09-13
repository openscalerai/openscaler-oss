package gateway

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"math"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"

	"github.com/swift-scale-ai/openscaler-oss/internal/auth"
	"github.com/swift-scale-ai/openscaler-oss/internal/router"
	"github.com/swift-scale-ai/openscaler-oss/internal/store"
)

type supplyContextKey struct{}
type supplyExecution struct {
	request   string
	attempt   int
	offer     store.SupplyOffer
	uncertain bool
}

func routeFingerprint(route router.Route) string {
	b, _ := json.Marshal(struct {
		Provider any
		Model    string
		Upstream string
		Key      string
	}{route.Provider, route.Model.ID, route.Model.UpstreamModel, route.APIKey})
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}
func (g *Gateway) registerSupply(mux *http.ServeMux) {
	mux.HandleFunc("GET /supply/{id}/v1/models", g.supplyModels)
	mux.HandleFunc("GET /supply/{id}/models", g.supplyModels)
	mux.HandleFunc("GET /api/admin/supply", g.withManagementAuth(g.listSupply))
	mux.HandleFunc("POST /api/admin/supply", g.withManagementAuth(g.createSupply))
	mux.HandleFunc("POST /api/admin/supply/{id}/{action}", g.withManagementAuth(g.changeSupply))
	mux.HandleFunc("GET /api/admin/supply/{id}/receipts/{request}/attempts", g.withManagementAuth(g.supplyAttempts))
	mux.HandleFunc("GET /api/admin/supply/{id}/receipts", g.withManagementAuth(g.supplyReceipts))
	mux.HandleFunc("GET /api/admin/supply/{id}/manifest", g.withManagementAuth(g.supplyManifest))
	mux.HandleFunc("POST /api/admin/supply-control/{action}", g.withManagementAuth(g.supplyControl))
	for path, capability := range map[string]string{"chat/completions": "chat", "responses": "responses", "embeddings": "embeddings", "images/generations": "image", "rerank": "rerank", "videos": "video", "audio/speech": "speech", "audio/transcriptions": "transcription"} {
		mux.HandleFunc("POST /supply/{id}/v1/"+path, g.supplyInference(capability))
	}
}
func (g *Gateway) supplyAvailable(w http.ResponseWriter) bool {
	if !g.cfg.SupplyEnabled {
		writeError(w, 409, "supply_disabled", "Set OPENSCALER_SUPPLY_ENABLED=true to explicitly enable supply publication.")
		return false
	}
	return true
}
func (g *Gateway) listSupply(w http.ResponseWriter, r *http.Request) {
	offers, err := g.store.Supplies(r.Context())
	if err != nil {
		writeError(w, 500, "storage_error", "Cannot read publications.")
		return
	}
	disconnected, err := g.store.SupplyDisconnected(r.Context())
	if err != nil {
		writeError(w, 500, "storage_error", "Cannot read connector state.")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, 200, map[string]any{"enabled": g.cfg.SupplyEnabled, "disconnected": disconnected, "offers": offers})
}
func (g *Gateway) createSupply(w http.ResponseWriter, r *http.Request) {
	if !g.supplyAvailable(w) {
		return
	}
	var o store.SupplyOffer
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10))
	dec.DisallowUnknownFields()
	if dec.Decode(&o) != nil {
		writeError(w, 400, "invalid_request", "Invalid publication.")
		return
	}
	u, err := url.Parse(o.PublicURL)
	if err != nil || u.Scheme != "https" || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || (u.Path != "" && u.Path != "/") {
		writeError(w, 400, "invalid_url", "Public URL must be an HTTPS origin without credentials.")
		return
	}
	o.PublicURL = strings.TrimRight(o.PublicURL, "/")
	if o.Model == "" || len(o.Model) > 256 || len(o.Providers) == 0 || len(o.Providers) > 16 || len(o.Capabilities) == 0 || o.Region == "" || len(o.Region) > 128 || strings.TrimSpace(o.Operator) == "" || len(o.Operator) > 256 || strings.TrimSpace(o.Evidence) == "" || len(o.Evidence) > 4096 || o.Concurrency < 1 || o.Concurrency > 1024 || o.RPM < 1 || o.RPM > 100000 || o.RequestBudget < 1 || o.RequestBudget > 10000000 || o.StartsAt.IsZero() || !o.EndsAt.After(o.StartsAt) || !o.EndsAt.After(time.Now()) || o.EndsAt.Sub(o.StartsAt) > 31*24*time.Hour || o.InputPrice < 0 || o.OutputPrice < 0 || math.IsNaN(o.InputPrice) || math.IsNaN(o.OutputPrice) || math.IsInf(o.InputPrice, 0) || math.IsInf(o.OutputPrice, 0) {
		writeError(w, 400, "invalid_offer", "Specify model, endpoints, capabilities, operator, authorization evidence, region, a service window of up to 31 days, positive limits and non-negative USD prices.")
		return
	}
	o.Fingerprints = map[string]string{}
	for _, capability := range o.Capabilities {
		if !slices.Contains([]string{"chat", "responses", "embeddings", "image", "rerank", "video", "speech", "transcription"}, capability) {
			writeError(w, 400, "invalid_capability", "Unsupported publication capability.")
			return
		}
		routes, e := g.router.Resolve(o.Model, capability)
		if e != nil {
			writeError(w, 400, "unavailable_model", e.Error())
			return
		}
		for _, id := range o.Providers {
			found := false
			for _, route := range routes {
				if route.Model.ID == o.Model && route.Provider.ID == id {
					found = true
					o.Fingerprints[id] = routeFingerprint(route)
				}
			}
			if !found {
				writeError(w, 400, "unavailable_endpoint", "Every selected endpoint must support every selected capability for the exact model.")
				return
			}
		}
	}
	o, token, err := g.store.CreateSupply(r.Context(), o)
	if err != nil {
		writeError(w, 500, "storage_error", "Cannot create publication.")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, 201, map[string]any{"offer": o, "credential": token})
}
func (g *Gateway) changeSupply(w http.ResponseWriter, r *http.Request) {
	if !g.supplyAvailable(w) {
		return
	}
	action := r.PathValue("action")
	if action == "reconcile" {
		var input struct {
			RequestID string `json:"request_id"`
			Confirm   bool   `json:"confirm_upstream_accounting"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&input) != nil || !input.Confirm {
			writeError(w, 400, "confirmation_required", "Confirm upstream execution and accounting were checked before releasing uncertain capacity.")
			return
		}
		if err := g.store.ReconcileSupply(r.Context(), r.PathValue("id"), input.RequestID); err != nil {
			writeError(w, 409, "reconcile_failed", err.Error())
			return
		}
		writeJSON(w, 200, map[string]bool{"reconciled": true})
		return
	}
	if action == "rotate-key" {
		token, err := g.store.RotateSupplyKey(r.Context(), r.PathValue("id"))
		if err != nil {
			writeError(w, 409, "rotation_failed", err.Error())
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		writeJSON(w, 200, map[string]string{"credential": token})
		return
	}
	if action == "publish" {
		g.supplyMu.Lock()
		defer g.supplyMu.Unlock()
		o, e := g.store.Supply(r.Context(), r.PathValue("id"))
		if e != nil {
			writeError(w, 404, "not_found", "Publication not found.")
			return
		}
		for _, id := range o.Providers {
			if g.privateRunning[id] > 0 {
				writeError(w, 409, "private_requests_running", "Wait for private requests on selected endpoints to finish before reserving capacity.")
				return
			}
		}
		var in struct {
			Consent   bool `json:"authorize_publication"`
			Exclusive bool `json:"reserve_selected_endpoints"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&in) != nil || !in.Consent || !in.Exclusive {
			writeError(w, 400, "consent_required", "Explicitly authorize publication and reservation of the selected endpoints away from private traffic.")
			return
		}
	}
	if err := g.store.TransitionSupply(r.Context(), r.PathValue("id"), action); err != nil {
		writeError(w, 409, "transition_failed", err.Error())
		return
	}
	o, err := g.store.Supply(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, 500, "storage_error", "Cannot read publication.")
		return
	}
	writeJSON(w, 200, o)
}
func (g *Gateway) supplyControl(w http.ResponseWriter, r *http.Request) {
	if !g.supplyAvailable(w) {
		return
	}
	action := r.PathValue("action")
	if action != "disconnect" && action != "connect" {
		writeError(w, 400, "invalid_action", "Use connect or disconnect.")
		return
	}
	if err := g.store.DisconnectSupply(r.Context(), action == "disconnect"); err != nil {
		writeError(w, 500, "storage_error", "Cannot persist connector state.")
		return
	}
	writeJSON(w, 200, map[string]bool{"disconnected": action == "disconnect"})
}
func (g *Gateway) supplyReceipts(w http.ResponseWriter, r *http.Request) {
	items, err := g.store.SupplyReceipts(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, 500, "storage_error", "Cannot read receipts.")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, 200, items)
}
func (g *Gateway) supplyManifest(w http.ResponseWriter, r *http.Request) {
	o, err := g.store.Supply(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, 404, "not_found", "Publication not found.")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, 200, map[string]any{"schema": "openscaler.supply.v1", "publication_id": o.ID, "state": o.State, "model_id": o.Model, "provider": o.Operator, "region": o.Region, "base_url": o.PublicURL + "/supply/" + o.ID, "chat_path": "/v1/chat/completions", "capabilities": o.Capabilities, "starts_at": o.StartsAt, "ends_at": o.EndsAt, "max_concurrency": o.Concurrency, "rpm": o.RPM, "request_budget": o.RequestBudget, "input_per_million": o.InputPrice, "output_per_million": o.OutputPrice, "authorization_evidence": o.Evidence})
}

type supplyWriter struct {
	streamDone bool
	tail       []byte
	http.ResponseWriter
	status int
}

func (w *supplyWriter) WriteHeader(status int) {
	if w.status == 0 {
		w.status = status
		w.ResponseWriter.WriteHeader(status)
	}
}
func (w *supplyWriter) Write(b []byte) (int, error) {
	if strings.Contains(w.Header().Get("Content-Type"), "text/event-stream") {
		w.tail = append(w.tail, b...)
		for {
			at := bytes.IndexByte(w.tail, '\n')
			if at < 0 {
				break
			}
			line := strings.TrimSpace(string(w.tail[:at]))
			w.tail = w.tail[at+1:]
			if strings.HasPrefix(line, "data:") {
				value := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
				var event struct {
					Type string `json:"type"`
				}
				if value == "[DONE]" || (json.Unmarshal([]byte(value), &event) == nil && event.Type == "response.completed") {
					w.streamDone = true
				}
			}
		}
		if len(w.tail) > 4<<20 {
			w.tail = nil
		}
	}

	if w.status == 0 {
		w.WriteHeader(200)
	}
	return w.ResponseWriter.Write(b)
}
func (w *supplyWriter) Unwrap() http.ResponseWriter { return w.ResponseWriter }
func (w *supplyWriter) Flush() {
	if w.status == 0 {
		w.WriteHeader(200)
	}
	_ = http.NewResponseController(w.ResponseWriter).Flush()
}
func (g *Gateway) supplyInference(capability string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !g.cfg.SupplyEnabled {
			writeError(w, 404, "not_found", "Supply is not enabled.")
			return
		}
		body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, g.cfg.MaxBodyBytes))
		if err != nil {
			writeError(w, 413, "request_too_large", "Request exceeds body limit.")
			return
		}
		model, err := requestModel(body, r.Header.Get("Content-Type"))
		if err != nil {
			writeError(w, 400, "invalid_model", "An exact model is required.")
			return
		}
		id := r.PathValue("id")
		o, err := g.store.Supply(r.Context(), id)
		if err != nil || model != o.Model || !slices.Contains(o.Capabilities, capability) {
			writeError(w, 403, "supply_scope_denied", "Publication does not allow this model and capability.")
			return
		}
		request := r.Header.Get("X-OpenScaler-Supply-Request-ID")
		if request == "" {
			request = requestIDFrom(r.Context())
		}
		if len(request) < 1 || len(request) > 128 || strings.ContainsAny(request, "\r\n") {
			writeError(w, 400, "invalid_request_id", "Request ID must be 1–128 characters.")
			return
		}
		o, err = g.store.AdmitSupply(r.Context(), id, auth.BearerToken(r), request)
		if err != nil {
			status := 503
			if errors.Is(err, store.ErrSupplyDenied) {
				status = 403
			}
			if errors.Is(err, store.ErrSupplyLimit) {
				status = 429
			}
			if errors.Is(err, store.ErrSupplyDuplicate) {
				status = 409
			}
			writeError(w, status, "supply_admission_denied", err.Error())
			return
		}
		execution := &supplyExecution{offer: o, request: request}
		wrapped := &supplyWriter{ResponseWriter: w}
		w.Header().Set("X-OpenScaler-Supply-Request-ID", request)
		defer func() {
			recovered := recover()
			state := "completed"
			if wrapped.status >= 400 {
				state = "failed"
			}
			if recovered != nil || execution.uncertain || r.Context().Err() != nil || wrapped.status == 0 {
				state = "unknown"
			}
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if e := g.store.FinishSupply(ctx, id, request, state, wrapped.status); e != nil {
				g.logger.Error("supply receipt persistence failed", "publication", id, "request", request, "error", e)
			}
			if recovered != nil {
				panic(recovered)
			}
		}()
		ctx := context.WithValue(r.Context(), supplyContextKey{}, execution)
		ctx = context.WithValue(ctx, apiKeyIDKey{}, "supply:"+id)
		ctx = context.WithValue(ctx, requestIDKey{}, "supply:"+id+":"+request)
		w.Header().Set("X-OpenScaler-Request-ID", "supply:"+id+":"+request)
		r = r.WithContext(ctx)
		r.Body = io.NopCloser(bytes.NewReader(body))
		g.inference(capability)(wrapped, r)
		if strings.Contains(w.Header().Get("Content-Type"), "text/event-stream") && !wrapped.streamDone {
			execution.uncertain = true
			g.supplyAttemptResult(r, "unknown", wrapped.status)
		}
	}
}

// Reserve selected endpoints exclusively for market traffic. Publication and private
// admission share a lock so publication cannot steal an in-flight private endpoint.
func (g *Gateway) scopeSupplyRoutes(r *http.Request, routes []router.Route) ([]router.Route, func(), error) {
	g.supplyMu.Lock()
	defer g.supplyMu.Unlock()
	out := []router.Route{}
	if execution, ok := r.Context().Value(supplyContextKey{}).(*supplyExecution); ok {
		for _, route := range routes {
			if route.Model.ID == execution.offer.Model && execution.offer.Fingerprints[route.Provider.ID] == routeFingerprint(route) {
				out = append(out, route)
			}
		}
		if len(out) == 0 {
			return nil, nil, errors.New("authorized endpoints changed or are unavailable; create a new publication")
		}
		return out, func() {}, nil
	}
	reserved, err := g.store.ReservedSupplyProviders(r.Context())
	if err != nil {
		return nil, nil, err
	}
	for _, route := range routes {
		if !reserved[route.Provider.ID] {
			out = append(out, route)
		}
	}
	if len(out) == 0 {
		return nil, nil, errors.New("no private endpoints available; supply endpoints are reserved")
	}
	for _, route := range out {
		g.privateRunning[route.Provider.ID]++
	}
	return out, func() {
		g.supplyMu.Lock()
		defer g.supplyMu.Unlock()
		for _, route := range out {
			g.privateRunning[route.Provider.ID]--
		}
	}, nil
}

func (g *Gateway) supplyModels(w http.ResponseWriter, r *http.Request) {
	if !g.cfg.SupplyEnabled {
		writeError(w, 404, "not_found", "Supply is not enabled.")
		return
	}
	o, err := g.store.CheckSupply(r.Context(), r.PathValue("id"), auth.BearerToken(r))
	if err != nil {
		writeError(w, 403, "supply_denied", "Publication is unavailable or credential is invalid.")
		return
	}
	writeJSON(w, 200, map[string]any{"object": "list", "data": []map[string]any{{"id": o.Model, "object": "model", "owned_by": o.Operator, "capabilities": o.Capabilities}}})
}

func (g *Gateway) supplyAttempts(w http.ResponseWriter, r *http.Request) {
	items, err := g.store.SupplyAttempts(r.Context(), r.PathValue("id"), r.PathValue("request"))
	if err != nil {
		writeError(w, 500, "storage_error", "Cannot read attempts.")
		return
	}
	writeJSON(w, 200, items)
}
func (g *Gateway) supplyAttemptResult(r *http.Request, state string, status int) {
	if execution, ok := r.Context().Value(supplyContextKey{}).(*supplyExecution); ok {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if e := g.store.FinishSupplyAttempt(ctx, execution.offer.ID, execution.request, execution.attempt, state, status); e != nil {
			execution.uncertain = true
			g.logger.Error("persist supply attempt", "error", e)
		}
	}
}

package gateway

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/swift-scale-ai/openscaler-oss/internal/auth"
	"github.com/swift-scale-ai/openscaler-oss/internal/catalog"
	"github.com/swift-scale-ai/openscaler-oss/internal/config"
	"github.com/swift-scale-ai/openscaler-oss/internal/provider"
	"github.com/swift-scale-ai/openscaler-oss/internal/router"
	"github.com/swift-scale-ai/openscaler-oss/internal/store"
)

func TestSupplyHTTPConsentScopeAndPrivateContinuity(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer upstream-secret" {
			t.Error("wrong upstream credential")
		}
		w.Header().Set("Content-Type", "application/json")
		io.WriteString(w, `{"model":"m","choices":[{"message":{"content":"ok"}}],"usage":{"prompt_tokens":1,"completion_tokens":1}}`)
	}))
	defer upstream.Close()
	c := &catalog.Catalog{Providers: []catalog.Provider{{ID: "market", Type: "openai-compatible", BaseURL: upstream.URL, ChatPath: "/chat"}, {ID: "private", Type: "openai-compatible", BaseURL: upstream.URL, ChatPath: "/chat"}}, Models: []catalog.Model{{ID: "m", Provider: "market", UpstreamModel: "m", Capabilities: []string{"chat"}}, {ID: "m", Provider: "private", UpstreamModel: "m", Capabilities: []string{"chat"}}}}
	db, e := store.Open(filepath.Join(t.TempDir(), "supply.db"))
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	rt := router.New(c, map[string]string{"market": "upstream-secret", "private": "upstream-secret"})
	cfg := config.Config{SupplyEnabled: true, AdminUsername: "admin", AdminPassword: "admin-key", APIKeys: []string{"private-key"}, MaxBodyBytes: 1 << 20}
	g := New(cfg, c, auth.New(cfg.APIKeys, false), rt, provider.NewClient(upstream.Client()), db, slog.New(slog.NewTextHandler(io.Discard, nil)))
	app := g.Handler()
	call := func(method, path, token, body string) *httptest.ResponseRecorder {
		t.Helper()
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		if token == "admin" {
			r.SetBasicAuth("admin", "admin-key")
		} else if token != "" {
			r.Header.Set("Authorization", "Bearer "+token)
		}
		w := httptest.NewRecorder()
		app.ServeHTTP(w, r)
		return w
	}
	o := store.SupplyOffer{Model: "m", Providers: []string{"market"}, Capabilities: []string{"chat"}, Operator: "Example operator", Evidence: "Owned deployment; test only", Region: "local", PublicURL: "https://supply.example", StartsAt: time.Now().Add(-time.Minute), EndsAt: time.Now().Add(time.Hour), Concurrency: 1, RPM: 20, RequestBudget: 10}
	body, _ := json.Marshal(o)
	w := call("POST", "/api/admin/supply", "admin", string(body))
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	var created struct {
		Offer      store.SupplyOffer `json:"offer"`
		Credential string            `json:"credential"`
	}
	if e = json.Unmarshal(w.Body.Bytes(), &created); e != nil {
		t.Fatal(e)
	}
	id := created.Offer.ID
	path := "/supply/" + id + "/v1/chat/completions"
	if w = call("POST", "/api/admin/supply/"+id+"/publish", "admin", `{}`); w.Code != 400 {
		t.Fatal(w.Code)
	}
	if w = call("POST", "/api/admin/supply/"+id+"/publish", "admin", `{"authorize_publication":true,"reserve_selected_endpoints":true}`); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = call("POST", path, "private-key", `{"model":"m"}`); w.Code != 403 {
		t.Fatal(w.Code)
	}
	if w = call("POST", path, created.Credential, `{"model":"different"}`); w.Code != 403 {
		t.Fatal(w.Code)
	}
	// The store runtime refresh is allowed; reset this isolated in-memory fixture each time.
	reset := func() { rt.Replace(c, map[string]string{"market": "upstream-secret", "private": "upstream-secret"}) }
	if w = call("POST", path, created.Credential, `{"model":"m"}`); w.Code != 200 || w.Header().Get("X-OpenScaler-Provider") != "market" {
		t.Fatal(w.Code, w.Body.String())
	}
	reset()
	manifest := call("GET", "/api/admin/supply/"+id+"/manifest", "admin", "").Body.String()
	if strings.Contains(manifest, "upstream-secret") || strings.Contains(manifest, "endpoint_fingerprints") || strings.Contains(manifest, upstream.URL) {
		t.Fatal("private metadata leaked")
	}
	call("POST", "/api/admin/supply-control/disconnect", "admin", `{}`)
	if w = call("POST", path, created.Credential, `{"model":"m"}`); w.Code != 403 {
		t.Fatal(w.Code)
	}
	if w = call("POST", "/v1/chat/completions", "private-key", `{"model":"m"}`); w.Code != 200 || w.Header().Get("X-OpenScaler-Provider") != "private" {
		t.Fatal(w.Code, w.Body.String())
	}
	reset()
	call("POST", "/api/admin/supply-control/connect", "admin", `{}`)
	rt.Replace(c, map[string]string{"market": "rotated-without-consent", "private": "upstream-secret"})
	if w = call("POST", path, created.Credential, `{"model":"m"}`); w.Code != 503 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = call("POST", "/api/admin/supply/"+id+"/withdraw", "admin", `{}`); w.Code != 200 {
		t.Fatal(w.Code)
	}
	receipts, e := db.SupplyReceipts(context.Background(), id)
	if e != nil || len(receipts) != 2 {
		t.Fatal(receipts, e)
	}
}

func TestSupplyStreamingWithdrawalDrainsAndTruncationIsUnknown(t *testing.T) {
	for _, complete := range []bool{true, false} {
		t.Run(map[bool]string{true: "complete", false: "truncated"}[complete], func(t *testing.T) {
			entered := make(chan struct{})
			finish := make(chan struct{})
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "text/event-stream")
				io.WriteString(w, "data: {\"choices\":[{\"delta\":{\"content\":\"hello\"}}]}\n\n")
				w.(http.Flusher).Flush()
				close(entered)
				<-finish
				if complete {
					io.WriteString(w, "data: [DONE]\n\n")
				}
			}))
			defer upstream.Close()
			db, e := store.Open(filepath.Join(t.TempDir(), "supply.db"))
			if e != nil {
				t.Fatal(e)
			}
			defer db.Close()
			c := &catalog.Catalog{Providers: []catalog.Provider{{ID: "p", Type: "openai-compatible", BaseURL: upstream.URL, ChatPath: "/chat"}}, Models: []catalog.Model{{ID: "m", Provider: "p", UpstreamModel: "m", Capabilities: []string{"chat", "streaming"}}}}
			rt := router.New(c, map[string]string{"p": "secret"})
			routes, e := rt.Resolve("m", "chat")
			if e != nil {
				t.Fatal(e)
			}
			o, key, e := db.CreateSupply(context.Background(), store.SupplyOffer{Model: "m", Providers: []string{"p"}, Capabilities: []string{"chat"}, Fingerprints: map[string]string{"p": routeFingerprint(routes[0])}, StartsAt: time.Now().Add(-time.Minute), EndsAt: time.Now().Add(time.Hour), Concurrency: 1, RPM: 20, RequestBudget: 20})
			if e != nil {
				t.Fatal(e)
			}
			if e = db.TransitionSupply(context.Background(), o.ID, "publish"); e != nil {
				t.Fatal(e)
			}
			g := New(config.Config{SupplyEnabled: true, MaxBodyBytes: 1 << 20}, c, auth.New(nil, false), rt, provider.NewClient(upstream.Client()), db, slog.New(slog.NewTextHandler(io.Discard, nil)))
			request := func() *http.Request {
				r := httptest.NewRequest("POST", "/supply/"+o.ID+"/v1/chat/completions", strings.NewReader(`{"model":"m","stream":true}`))
				r.Header.Set("Authorization", "Bearer "+key)
				r.Header.Set("Content-Type", "application/json")
				return r
			}
			done := make(chan struct{})
			go func() { defer close(done); g.Handler().ServeHTTP(httptest.NewRecorder(), request()) }()
			select {
			case <-entered:
			case <-time.After(5 * time.Second):
				close(finish)
				t.Fatal("upstream did not start")
			}
			if e = db.TransitionSupply(context.Background(), o.ID, "withdraw"); e != nil {
				close(finish)
				t.Fatal(e)
			}
			current, _ := db.Supply(context.Background(), o.ID)
			if current.State != "draining" {
				close(finish)
				t.Fatal(current.State)
			}
			w := httptest.NewRecorder()
			g.Handler().ServeHTTP(w, request())
			if w.Code != 403 {
				close(finish)
				t.Fatal(w.Code)
			}
			close(finish)
			select {
			case <-done:
			case <-time.After(5 * time.Second):
				t.Fatal("request did not drain")
			}
			receipts, e := db.SupplyReceipts(context.Background(), o.ID)
			if e != nil || len(receipts) != 1 {
				t.Fatal(receipts, e)
			}
			current, _ = db.Supply(context.Background(), o.ID)
			if complete {
				if receipts[0].State != "completed" || current.State != "withdrawn" {
					t.Fatal(receipts, current.State)
				}
			} else {
				if receipts[0].State != "unknown" || current.State != "draining" {
					t.Fatal(receipts, current.State)
				}
			}
		})
	}
}

func TestSupplyProtocolPaths(t *testing.T) {
	cases := []struct{ path, capability, providerPath string }{
		{"chat/completions", "chat", "/v1/chat/completions"}, {"responses", "responses", "/v1/responses"}, {"embeddings", "embeddings", "/v1/embeddings"}, {"images/generations", "image", "/v1/images/generations"}, {"rerank", "rerank", "/v1/rerank"}, {"videos", "video", "/v1/videos"}, {"audio/speech", "speech", "/v1/audio/speech"}, {"audio/transcriptions", "transcription", "/v1/audio/transcriptions"},
	}
	for _, tc := range cases {
		t.Run(tc.path, func(t *testing.T) {
			seen := false
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				seen = true
				if r.URL.Path != tc.providerPath {
					t.Errorf("path %s", r.URL.Path)
				}
				if r.Header.Get("Authorization") != "Bearer upstream-key" {
					t.Error("wrong auth")
				}
				if tc.capability == "transcription" {
					if err := r.ParseMultipartForm(1 << 20); err != nil {
						t.Error(err)
					}
					if r.FormValue("model") != "m" {
						t.Error("multipart model changed")
					}
				} else {
					var body struct {
						Model string `json:"model"`
					}
					if json.NewDecoder(r.Body).Decode(&body) != nil || body.Model != "m" {
						t.Error("model mismatch")
					}
				}
				w.Header().Set("Content-Type", "application/json")
				io.WriteString(w, `{"id":"mock","model":"m","data":[],"usage":{"prompt_tokens":1,"completion_tokens":1}}`)
			}))
			defer upstream.Close()
			db, e := store.Open(filepath.Join(t.TempDir(), "protocol.db"))
			if e != nil {
				t.Fatal(e)
			}
			defer db.Close()
			c := &catalog.Catalog{Providers: []catalog.Provider{{ID: "p", Type: "openai-compatible", BaseURL: upstream.URL}}, Models: []catalog.Model{{ID: "m", Provider: "p", UpstreamModel: "m", Capabilities: []string{tc.capability}}}}
			if e = c.Validate(); e != nil {
				t.Fatal(e)
			}
			rt := router.New(c, map[string]string{"p": "upstream-key"})
			routes, e := rt.Resolve("m", tc.capability)
			if e != nil {
				t.Fatal(e)
			}
			o, key, e := db.CreateSupply(context.Background(), store.SupplyOffer{Model: "m", Providers: []string{"p"}, Capabilities: []string{tc.capability}, Fingerprints: map[string]string{"p": routeFingerprint(routes[0])}, StartsAt: time.Now().Add(-time.Minute), EndsAt: time.Now().Add(time.Hour), Concurrency: 1, RPM: 10, RequestBudget: 10})
			if e != nil {
				t.Fatal(e)
			}
			if e = db.TransitionSupply(context.Background(), o.ID, "publish"); e != nil {
				t.Fatal(e)
			}
			var body bytes.Buffer
			contentType := "application/json"
			if tc.capability == "transcription" {
				writer := multipart.NewWriter(&body)
				writer.WriteField("model", "m")
				file, _ := writer.CreateFormFile("file", "test.wav")
				file.Write([]byte("test-audio"))
				writer.Close()
				contentType = writer.FormDataContentType()
			} else {
				body.WriteString(`{"model":"m","input":"synthetic"}`)
			}
			g := New(config.Config{SupplyEnabled: true, MaxBodyBytes: 1 << 20}, c, auth.New(nil, false), rt, provider.NewClient(upstream.Client()), db, slog.New(slog.NewTextHandler(io.Discard, nil)))
			r := httptest.NewRequest("POST", "/supply/"+o.ID+"/v1/"+tc.path, &body)
			r.Header.Set("Content-Type", contentType)
			r.Header.Set("Authorization", "Bearer "+key)
			w := httptest.NewRecorder()
			g.Handler().ServeHTTP(w, r)
			if w.Code != 200 || !seen {
				t.Fatal(w.Code, w.Body.String(), seen)
			}
		})
	}
}

package gateway

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/swift-scale-ai/openscaler-oss/internal/config"
)

// Public static resources must work without a database, provider, or Cloud client.
func TestStandalonePublicResources(t *testing.T) {
	app := New(config.Config{}, nil, nil, nil, nil, nil, slog.New(slog.NewTextHandler(io.Discard, nil))).Handler()
	for _, tc := range []struct {
		path   string
		status int
		body   string
	}{
		{"/", http.StatusOK, "OpenScaler"},
		{"/openscaler-logo.svg", http.StatusOK, "OpenScaler logo"},
		{"/docs/API.md", http.StatusOK, "X-OpenScaler-"},
		{"/docs/CLOUD_RELATIONSHIP.md", http.StatusOK, "Supply Connector"},
		{"/docs/embed.go", http.StatusNotFound, "404"},
		{"/docs/secrets/master.key", http.StatusNotFound, "404"},
	} {
		t.Run(tc.path, func(t *testing.T) {
			w := httptest.NewRecorder()
			app.ServeHTTP(w, httptest.NewRequest(http.MethodGet, tc.path, nil))
			if w.Code != tc.status || !strings.Contains(w.Body.String(), tc.body) {
				t.Fatalf("unexpected response: status=%d body=%s", w.Code, w.Body.String())
			}
			if w.Header().Get("X-OpenScaler-Request-ID") == "" {
				t.Fatal("missing branded request ID")
			}
			if strings.Contains(w.Body.String(), "OpenSwiftScale") {
				t.Fatal("legacy brand in public resource")
			}
		})
	}
}

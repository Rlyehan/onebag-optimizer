package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Rlyehan/onebag-optimizer/internal/session"
	"go.uber.org/zap"
)

func TestMiddleware(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	sessionManager := session.NewManager(time.Hour)
	middleware := NewMiddleware(logger, sessionManager)

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	tests := []struct {
		name           string
		middleware     func(http.Handler) http.Handler
		expectedStatus int
		expectedHeader map[string]string
		setup          func(*httptest.Server)
	}{
		{
			name:           "RateLimitMiddleware",
			middleware:     middleware.RateLimitMiddleware,
			expectedStatus: http.StatusOK,
			setup: func(server *httptest.Server) {
				for i := 0; i < 10; i++ {
					resp, _ := http.Get(server.URL)
					if i == 5 && resp.StatusCode != http.StatusTooManyRequests {
						t.Errorf("Expected rate limit to be exceeded after 5 requests")
					}
				}
			},
		},
		{
			name:       "SecurityHeaders",
			middleware: middleware.SecurityHeaders,
			expectedHeader: map[string]string{
				"X-XSS-Protection":        "1; mode=block",
				"X-Frame-Options":         "DENY",
				"X-Content-Type-Options":  "nosniff",
				"Referrer-Policy":         "strict-origin-when-cross-origin",
				"Content-Security-Policy": "default-src 'self'",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := tt.middleware(testHandler)
			server := httptest.NewServer(handler)
			defer server.Close()

			if tt.setup != nil {
				tt.setup(server)
			}

			resp, err := http.Get(server.URL)
			if err != nil {
				t.Fatalf("Failed to send request: %v", err)
			}
			defer resp.Body.Close()

			if tt.expectedStatus != 0 && resp.StatusCode != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, resp.StatusCode)
			}

			for k, v := range tt.expectedHeader {
				if resp.Header.Get(k) != v {
					t.Errorf("Expected header %s to be %s, got %s", k, v, resp.Header.Get(k))
				}
			}
		})
	}
}

package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Rlyehan/onebag-optimizer/internal/config"
	"github.com/Rlyehan/onebag-optimizer/internal/models"
	"github.com/Rlyehan/onebag-optimizer/internal/session"
	"github.com/Rlyehan/onebag-optimizer/internal/storage"
	"go.uber.org/zap"
)

func TestRouter(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	cfg := &config.Config{
		S3BucketName: "test-bucket",
		ServerPort:   "8080",
	}
	sessionManager := session.NewManager(cfg.SessionExpiry)
	s3Client, _ := storage.NewS3Client(context.Background(), cfg.AWSConfig)

	router := NewRouter(logger, s3Client, sessionManager, cfg)
	server := httptest.NewServer(router.SetupRoutes())
	defer server.Close()

	tests := []struct {
		name           string
		method         string
		path           string
		body           interface{}
		expectedStatus int
	}{
		{
			name:           "Root Handler",
			method:         "GET",
			path:           "/",
			expectedStatus: http.StatusOK,
		},
		{
			name:   "Upload List Handler",
			method: "POST",
			path:   "/upload",
			body: []models.TravelItem{
				{Name: "Test Item", Amount: 1, Weight: 100, Category: "Clothing", Priority: "High", BagType: "Carry-on"},
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Static File Handler",
			method:         "GET",
			path:           "/static/index.html",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Metrics Handler",
			method:         "GET",
			path:           "/metrics",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req *http.Request
			var err error

			if tt.body != nil {
				bodyBytes, _ := json.Marshal(tt.body)
				req, err = http.NewRequest(tt.method, server.URL+tt.path, bytes.NewBuffer(bodyBytes))
			} else {
				req, err = http.NewRequest(tt.method, server.URL+tt.path, nil)
			}

			if err != nil {
				t.Fatalf("Failed to create request: %v", err)
			}

			if tt.method == "POST" {
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("X-Object-Key", "test-key")
			}

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Failed to send request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, resp.StatusCode)
			}
		})
	}
}

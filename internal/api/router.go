package api

import (
	"net/http"

	"github.com/Rlyehan/onebag-optimizer/internal/api/handlers"
	"github.com/Rlyehan/onebag-optimizer/internal/api/middleware"
	"github.com/Rlyehan/onebag-optimizer/internal/config"
	"github.com/Rlyehan/onebag-optimizer/internal/metrics"
	"github.com/Rlyehan/onebag-optimizer/internal/session"
	"github.com/Rlyehan/onebag-optimizer/internal/storage"
	"go.uber.org/zap"
)

type Router struct {
	logger     *zap.Logger
	s3Client   *storage.S3Client
	session    *session.Manager
	config     *config.Config
	middleware *middleware.Middleware
}

func NewRouter(logger *zap.Logger, s3Client *storage.S3Client, sessionManager *session.Manager, cfg *config.Config) *Router {
	return &Router{
		logger:     logger,
		s3Client:   s3Client,
		session:    sessionManager,
		config:     cfg,
		middleware: middleware.NewMiddleware(logger, sessionManager),
	}
}

func (r *Router) SetupRoutes() http.Handler {
	mux := http.NewServeMux()

	rootHandler := handlers.NewRootHandler(r.logger)
	listHandler := handlers.NewListHandler(r.logger, r.s3Client, r.config.S3BucketName)

	applyMiddleware := func(h http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, req *http.Request) {
			handler := r.middleware.SecurityHeaders(
				r.middleware.RateLimitMiddleware(
					r.middleware.SessionMiddleware(h),
				),
			)
			handler.ServeHTTP(w, req)
		}
	}

	// Application Routes
	mux.HandleFunc("/", applyMiddleware(rootHandler.ServeRoot))
	mux.HandleFunc("/upload", applyMiddleware(listHandler.UploadList))

	fs := http.FileServer(http.Dir("static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	mux.Handle("/metrics", metrics.MetricsHandler())

	return mux
}

package metrics

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/sdk/resource"
	tracesdk "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.7.0"
)

var (
	RequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	RequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	UploadRequests = promauto.NewCounter(prometheus.CounterOpts{
		Name: "onebag_upload_requests_total",
		Help: "The total number of upload requests",
	})

	RateLimitedRequests = promauto.NewCounter(prometheus.CounterOpts{
		Name: "onebag_rate_limited_requests_total",
		Help: "The total number of rate-limited requests",
	})

	ActiveSessions = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "onebag_active_sessions",
		Help: "The number of active sessions",
	})

	ListItemCount = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "onebag_list_item_count",
		Help:    "The number of items in uploaded lists",
		Buckets: []float64{1, 5, 10, 20, 50, 100, 200},
	})
)

func SetupTracing(serviceName string) (*tracesdk.TracerProvider, error) {
	exporter, err := jaeger.New(jaeger.WithCollectorEndpoint())
	if err != nil {
		return nil, err
	}

	tp := tracesdk.NewTracerProvider(
		tracesdk.WithBatcher(exporter),
		tracesdk.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String(serviceName),
		)),
	)

	otel.SetTracerProvider(tp)
	return tp, nil
}

func MetricsHandler() http.Handler {
	return promhttp.Handler()
}

// RecordMetrics is a helper function to record common metrics
func RecordMetrics(method, path string, status int, duration float64) {
	RequestsTotal.WithLabelValues(method, path, http.StatusText(status)).Inc()
	RequestDuration.WithLabelValues(method, path).Observe(duration)
}

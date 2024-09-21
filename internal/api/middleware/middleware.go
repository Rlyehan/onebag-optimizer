package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/Rlyehan/onebag-optimizer/internal/session"
	"github.com/Rlyehan/onebag-optimizer/internal/utils"
	"go.uber.org/zap"
	"golang.org/x/time/rate"
)

type Middleware struct {
	logger        *zap.Logger
	session       *session.Manager
	ipLimiter     *IPRateLimiter
	globalLimiter *rate.Limiter
}

type IPRateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       *sync.RWMutex
	limit    rate.Limit
	burst    int
}

func NewIPRateLimiter(requestsPerSecond rate.Limit, burstSize int) *IPRateLimiter {
	return &IPRateLimiter{
		limiters: make(map[string]*rate.Limiter),
		mu:       &sync.RWMutex{},
		limit:    requestsPerSecond,
		burst:    burstSize,
	}
}

func (limiter *IPRateLimiter) AddIP(ip string) *rate.Limiter {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	ipLimiter := rate.NewLimiter(limiter.limit, limiter.burst)
	limiter.limiters[ip] = ipLimiter
	return ipLimiter
}

func (limiter *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	limiter.mu.Lock()
	ipLimiter, exists := limiter.limiters[ip]

	if !exists {
		limiter.mu.Unlock()
		return limiter.AddIP(ip)
	}

	limiter.mu.Unlock()
	return ipLimiter
}

func NewMiddleware(logger *zap.Logger, session *session.Manager) *Middleware {
	return &Middleware{
		logger:        logger,
		session:       session,
		ipLimiter:     NewIPRateLimiter(10, 25),
		globalLimiter: rate.NewLimiter(200, 300),
	}
}

func (m *Middleware) SessionMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("session_id")
		var currentSession *session.Session

		if err != nil || sessionCookie.Value == "" {
			currentSession, err = m.session.CreateSession()
			if err != nil {
				utils.HandleError(w, m.logger, http.StatusInternalServerError, err, "Failed to create session", "SessionMiddleware")
				return
			}
			http.SetCookie(w, &http.Cookie{
				Name:     "session_id",
				Value:    currentSession.ID,
				Expires:  time.Now().Add(m.session.GetExpiry()),
				Secure:   true,
				HttpOnly: true,
			})
		} else {
			var exists bool
			currentSession, exists = m.session.GetSession(sessionCookie.Value)
			if !exists {
				currentSession, err = m.session.CreateSession()
				if err != nil {
					utils.HandleError(w, m.logger, http.StatusInternalServerError, err, "Failed to create session", "SessionMiddleware")
					return
				}
				http.SetCookie(w, &http.Cookie{
					Name:     "session_id",
					Value:    currentSession.ID,
					Expires:  time.Now().Add(m.session.GetExpiry()),
					Secure:   true,
					HttpOnly: true,
				})
			}
		}

		if r.Method == "POST" || r.Method == "PUT" || r.Method == "DELETE" {
			csrfToken := r.Header.Get("X-CSRF-Token")
			if csrfToken == "" || !m.session.ValidateCSRFToken(currentSession.ID, csrfToken) {
				utils.HandleError(w, m.logger, http.StatusForbidden, nil, "Invalid CSRF token", "SessionMiddleware")
				return
			}
		}

		if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
			if token, ok := currentSession.Values["csrfToken"].(string); ok {
				w.Header().Set("X-CSRF-Token", token)
			}
		}

		next.ServeHTTP(w, r)
	}
}

func (m *Middleware) RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientIP := r.RemoteAddr
		ipLimiter := m.ipLimiter.GetLimiter(clientIP)

		if !ipLimiter.Allow() {
			http.Error(w, "IP rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		if !m.globalLimiter.Allow() {
			http.Error(w, "Global rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (m *Middleware) SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Content-Security-Policy", "default-src 'self'")
		next.ServeHTTP(w, r)
	})
}

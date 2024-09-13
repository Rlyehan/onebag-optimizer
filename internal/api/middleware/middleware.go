package middleware

import (
	"net/http"
	"time"

	"github.com/Rlyehan/onebag-optimizer/internal/session"
	"github.com/Rlyehan/onebag-optimizer/internal/utils"
	"go.uber.org/zap"
)

type Middleware struct {
	logger  *zap.Logger
	session *session.Manager
}

func NewMiddleware(logger *zap.Logger, session *session.Manager) *Middleware {
	return &Middleware{
		logger:  logger,
		session: session,
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

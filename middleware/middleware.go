package middleware

import (
	"github.com/Rlyehan/onebag-optimizer/session"
	"github.com/Rlyehan/onebag-optimizer/utils"
	"net/http"
	"time"
)

func SessionMiddleware(next http.HandlerFunc, sm *session.SessionManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("session_id")
		var currentSession *session.Session
		var csrfToken string

		if r.Method == "POST" || r.Method == "PUT" || r.Method == "DELETE" {
			csrfToken = r.Header.Get("X-CSRF-Token")
		}

		if err != nil || sessionCookie.Value == "" {
			currentSession, err := sm.CreateSession()
			if err != nil {
				utils.HandleError(w, http.StatusInternalServerError, err, "Failed to create session", "SessionMiddleware")
				return
			}
			http.SetCookie(w, &http.Cookie{
				Name:     "session_id",
				Value:    currentSession.ID,
				Expires:  time.Now().Add(sm.Expiry),
				Secure:   true,
				HttpOnly: true,
			})
		} else {
			var exists bool
			currentSession, exists = sm.GetSession(sessionCookie.Value)
			if !exists {
				currentSession, err := sm.CreateSession()
				if err != nil {
					utils.HandleError(w, http.StatusInternalServerError, err, "Failed to create session", "SessionMiddleware")
					return
				}
				http.SetCookie(w, &http.Cookie{
					Name:     "session_id",
					Value:    currentSession.ID,
					Expires:  time.Now().Add(sm.Expiry),
					Secure:   true,
					HttpOnly: true,
				})
			}
		}

		if csrfToken != "" && !sm.ValidateCSRFToken(sessionCookie.Value, csrfToken) {
			utils.HandleError(w, http.StatusInternalServerError, err, "Failed to create session", "SessionMiddleware")
			return
		}

		if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
			if currentSession != nil {
				if token, ok := currentSession.Values["csrfToken"].(string); ok {
					w.Header().Set("X-CSRF-Token", token)
				}
			}
		}
		next.ServeHTTP(w, r)
	}
}

package middleware

import (
	"log"
	"net/http"
	"time"
	"github.com/Rlyehan/onebag-optimizer/session"
)

func SessionMiddleware(next http.HandlerFunc, sm *session.SessionManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("session_id")
		if err != nil || sessionCookie.Value == "" {
			session, err := sm.CreateSession()
			if err != nil {
				log.Printf("Failed to create session: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			http.SetCookie(w, &http.Cookie{
				Name:    "session_id",
				Value:   session.ID,
				Expires: time.Now().Add(sm.Expiry),
			})
		} else {
			_, exists := sm.GetSession(sessionCookie.Value)
			if !exists {
				session, err := sm.CreateSession()
				if err != nil {
					log.Printf("Failed to create session: %v", err)
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					return
				}
				http.SetCookie(w, &http.Cookie{
					Name:    "session_id",
					Value:   session.ID,
					Expires: time.Now().Add(sm.Expiry),
				})
			}
		}
		next.ServeHTTP(w, r)
	}
}
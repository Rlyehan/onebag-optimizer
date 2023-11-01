package session

import (
	"crypto/rand"
	"encoding/base64"
	"sync"
	"time"
)

type Session struct {
	ID         string
	LastAccess time.Time
	Values     map[string]interface{}
}

type SessionManager struct {
	sessions map[string]*Session
	mutex    sync.Mutex
	Expiry   time.Duration
}

func NewSessionManager(Expiry time.Duration) *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
		Expiry:   Expiry,
	}
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (sm *SessionManager) CreateSession() (*Session, error) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	sessionID, err := generateToken()
	if err != nil {
		return nil, err
	}

	csrfToken, err := generateToken()
	if err != nil {
		return nil, err
	}

	session := &Session{
		ID:         sessionID,
		LastAccess: time.Now(),
		Values:     map[string]interface{}{"csrfToken": csrfToken},
	}
	sm.sessions[session.ID] = session
	return session, nil
}

func (sm *SessionManager) GetSession(sessionID string) (*Session, bool) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	session, found := sm.sessions[sessionID]
	if !found {
		return nil, false
	}

	session.LastAccess = time.Now()
	return session, true
}

func (sm *SessionManager) Cleanup() {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	for id, session := range sm.sessions {
		if time.Since(session.LastAccess) > sm.Expiry {
			delete(sm.sessions, id)
		}
	}
}

func (sm *SessionManager) ValidateCSRFToken(sessionID, token string) bool {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	session, found := sm.sessions[sessionID]
	if !found {
		return false
	}

	if csrfToken, ok := session.Values["csrfToken"].(string); ok {
		return token == csrfToken
	}

	return false
}

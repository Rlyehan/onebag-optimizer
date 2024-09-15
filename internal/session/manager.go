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

type Manager struct {
	sessions map[string]*Session
	mu       sync.RWMutex
	expiry   time.Duration
}

func NewManager(expiry time.Duration) *Manager {
	return &Manager{
		sessions: make(map[string]*Session),
		expiry:   expiry,
	}
}

func (m *Manager) CreateSession() (*Session, error) {
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

	m.mu.Lock()
	m.sessions[session.ID] = session
	m.mu.Unlock()

	return session, nil
}

func (m *Manager) GetSession(sessionID string) (*Session, bool) {
	m.mu.RLock()
	session, found := m.sessions[sessionID]
	m.mu.RUnlock()

	if !found {
		return nil, false
	}

	m.mu.Lock()
	session.LastAccess = time.Now()
	m.mu.Unlock()

	return session, true
}

func (m *Manager) ValidateCSRFToken(sessionID, token string) bool {
	m.mu.RLock()
	session, found := m.sessions[sessionID]
	m.mu.RUnlock()

	if !found {
		return false
	}

	if csrfToken, ok := session.Values["csrfToken"].(string); ok {
		return token == csrfToken
	}

	return false
}

func (m *Manager) StartCleanupTask(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		m.cleanup()
	}
}

func (m *Manager) cleanup() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for id, session := range m.sessions {
		if time.Since(session.LastAccess) > m.expiry {
			delete(m.sessions, id)
		}
	}
}

func (m *Manager) GetExpiry() time.Duration {
	return m.expiry
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

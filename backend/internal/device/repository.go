package gateway

import (
	"chickmate-api/internal/models"
	"sync"
)

// In-memory live connection registry
type Repository struct {
	mu   sync.RWMutex
	live map[string]*models.GatewayConn
}

func NewRepository() *Repository {
	return &Repository{live: make(map[string]*models.GatewayConn)}
}

func (r *Repository) Put(gc *models.GatewayConn) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.live[gc.ID] = gc
}

func (r *Repository) Remove(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.live, id)
}

func (r *Repository) Get(id string) (*models.GatewayConn, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.live[id]
	return c, ok
}

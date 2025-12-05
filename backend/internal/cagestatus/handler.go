package cagestatus

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts the Cage Status API endpoints
func (h *Handler) RegisterRoutes(r chi.Router) {
	// React calls: GET /batches/active
	r.Route("/batches", func(r chi.Router) {
		r.Get("/active", h.getActiveBatches)
	})
}

func (h *Handler) getActiveBatches(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	batches, err := h.svc.ListActiveBatches(ctx)
	if err != nil {
		http.Error(w, "failed to load active batches", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(batches); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

// File: backend/internal/supplier/handler.go
package supplier

import (
	"chickmate-api/internal/util" // We'll use our shared utilities
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *chi.Mux) {
	router.Get("/api/suppliers", h.getSuppliers)
	// Add other routes like POST, PUT, DELETE here later
}

func (h *Handler) getSuppliers(w http.ResponseWriter, r *http.Request) {
	suppliers, err := h.service.GetSuppliers(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch suppliers", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, suppliers)
}
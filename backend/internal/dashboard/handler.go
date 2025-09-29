// File: backend/internal/dashboard/handler.go
package dashboard

import (
	"chickmate-api/internal/util"
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
	router.Get("/api/dashboard", h.getDashboardData)
}

func (h *Handler) getDashboardData(w http.ResponseWriter, r *http.Request) {
	
	data, err := h.service.GenerateDashboardData(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to generate dashboard data", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, data)
}
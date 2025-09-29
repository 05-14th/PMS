// File: backend/internal/customer/handler.go
package customer

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
	router.Get("/api/customers", h.getCustomers)
}

func (h *Handler) getCustomers(w http.ResponseWriter, r *http.Request) {
	customers, err := h.service.GetCustomers(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch customers", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, customers)
}
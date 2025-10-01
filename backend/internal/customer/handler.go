// File: backend/internal/customer/handler.go
package customer

import (
	"chickmate-api/internal/models"
	"chickmate-api/internal/util"
	"net/http"
	"strconv"

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
	router.Post("/api/customers", h.createCustomer)
	router.Put("/api/customers/{id}", h.updateCustomer)
	router.Delete("/api/customers/{id}", h.deleteCustomer)
}

func (h *Handler) getCustomers(w http.ResponseWriter, r *http.Request) {
	customers, err := h.service.GetCustomers(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch customers", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, customers)
}

func (h *Handler) createCustomer(w http.ResponseWriter, r *http.Request) {
	var payload models.Customer
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	customerID, err := h.service.CreateCustomer(r.Context(), payload)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": customerID})
}

func (h *Handler) updateCustomer(w http.ResponseWriter, r *http.Request) {
	customerID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var payload models.Customer
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	err := h.service.UpdateCustomer(r.Context(), payload, customerID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func (h *Handler) deleteCustomer(w http.ResponseWriter, r *http.Request) {
	customerID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	err := h.service.DeleteCustomer(r.Context(), customerID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}
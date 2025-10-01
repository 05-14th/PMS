// File: backend/internal/supplier/handler.go
package supplier

import (
	"chickmate-api/internal/models"
	"chickmate-api/internal/util" // We'll use our shared utilities
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
	router.Get("/api/suppliers", h.getSuppliers)
	router.Post("/api/suppliers", h.createSupplier)
	router.Put("/api/suppliers/{id}", h.updateSupplier)
	router.Delete("/api/suppliers/{id}", h.deleteSupplier)
}

func (h *Handler) getSuppliers(w http.ResponseWriter, r *http.Request) {
	suppliers, err := h.service.GetSuppliers(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch suppliers", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, suppliers)
}

func (h *Handler) createSupplier(w http.ResponseWriter, r *http.Request) {
	var payload models.Supplier
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	supplierID, err := h.service.CreateSupplier(r.Context(), payload)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": supplierID})
}

func (h *Handler) updateSupplier(w http.ResponseWriter, r *http.Request) {
	supplierID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var payload models.Supplier
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	err := h.service.UpdateSupplier(r.Context(), payload, supplierID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func (h *Handler) deleteSupplier(w http.ResponseWriter, r *http.Request) {
	supplierID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	err := h.service.DeleteSupplier(r.Context(), supplierID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to delete supplier", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}
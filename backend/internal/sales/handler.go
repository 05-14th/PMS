// File: backend/internal/sales/handler.go
package sales

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
	router.Get("/api/sales", h.getSalesHistory)
	router.Get("/api/sale-products", h.getAvailableProducts)
	router.Post("/api/sales", h.createSale)
	router.Get("/api/sales/{id}", h.getSaleDetails)
	router.Get("/api/payment-methods", h.getPaymentMethods)

}

func (h *Handler) getSalesHistory(w http.ResponseWriter, r *http.Request) {
	history, err := h.service.GetSalesHistory(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch sales history", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, history)
}

func (h *Handler) getAvailableProducts(w http.ResponseWriter, r *http.Request) {
	productType := r.URL.Query().Get("type")
	products, err := h.service.GetAvailableProducts(r.Context(), productType)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch available products", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, products)
}

func (h *Handler) getSaleDetails(w http.ResponseWriter, r *http.Request) {
	saleIDStr := chi.URLParam(r, "id")
	saleID, err := strconv.Atoi(saleIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid sale ID", err)
		return
	}

	details, err := h.service.GetSaleDetails(r.Context(), saleID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch sale details", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, details)
}

func (h *Handler) createSale(w http.ResponseWriter, r *http.Request) {
	var payload models.SalePayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	saleID, err := h.service.CreateSale(r.Context(), payload)
	if err != nil {
		// This could be a DB error or an insufficient stock error
		util.HandleError(w, http.StatusInternalServerError, "Failed to create sale", err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "saleID": saleID})
}

func (h *Handler) getPaymentMethods(w http.ResponseWriter, r *http.Request) {
	methods, err := h.service.GetPaymentMethods(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch payment methods", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, methods)
}
// File: backend/internal/sales/handler.go
package sales

import (
	"chickmate-api/internal/models"
	"chickmate-api/internal/util"
	"log"
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
    router.Post("/api/sales", h.createPreOrder)
    router.Get("/api/sales/{id}", h.getSaleDetails)
    router.Post("/api/sales/{id}/fulfill", h.fulfillOrder)
    router.Delete("/api/sales/{id}", h.voidSale) // Add this line

    router.Get("/api/batches-for-sale", h.getActiveBatchesForSale)
    router.Get("/api/payment-methods", h.getPaymentMethods)
    router.Get("/api/harvested-products", h.getHarvestedProducts)
}

// createPreOrder handles the creation of a new pending order.
func (h *Handler) createPreOrder(w http.ResponseWriter, r *http.Request) {
	var payload models.SalePayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	saleID, err := h.service.CreatePreOrder(r.Context(), payload)
	if err != nil {
		// This could be a DB error or an insufficient stock error from the service
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "saleID": saleID})
}

// fulfillOrder handles the fulfillment of a pending order.
func (h *Handler) fulfillOrder(w http.ResponseWriter, r *http.Request) {
	saleID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid Sale ID", err)
		return
	}

	var payload models.FulfillmentPayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	if err := h.service.FulfillOrder(r.Context(), saleID, payload); err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fulfill order", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// getActiveBatchesForSale provides the list of batches for the pre-order form.
func (h *Handler) getActiveBatchesForSale(w http.ResponseWriter, r *http.Request) {
	batches, err := h.service.GetActiveBatchesForSale(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch active batches", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, batches)
}


func (h *Handler) getSalesHistory(w http.ResponseWriter, r *http.Request) {
	history, err := h.service.GetSalesHistory(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch sales history", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, history)
}

func (h *Handler) getSaleDetails(w http.ResponseWriter, r *http.Request) {
	saleID, err := strconv.Atoi(chi.URLParam(r, "id"))
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

func (h *Handler) getPaymentMethods(w http.ResponseWriter, r *http.Request) {
	methods, err := h.service.GetPaymentMethods(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch payment methods", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, methods)
}

func (h *Handler) getHarvestedProducts(w http.ResponseWriter, r *http.Request) {
	products, err := h.service.GetHarvestedProducts(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch harvested products", err)
		return
	}

	// --- 2. ADD THIS LOGGING LINE ---
	// This will print the data to your backend terminal.
	log.Printf("DEBUG: Fetched harvested products from DB: %+v\n", products)

	util.RespondJSON(w, http.StatusOK, products)
}

// In sales/handler.go - Add voidSale method
func (h *Handler) voidSale(w http.ResponseWriter, r *http.Request) {
    saleID, err := strconv.Atoi(chi.URLParam(r, "id"))
    if err != nil {
        util.HandleError(w, http.StatusBadRequest, "Invalid sale ID", err)
        return
    }

    if err := h.service.VoidSale(r.Context(), saleID); err != nil {
        util.HandleError(w, http.StatusInternalServerError, "Failed to void sale", err)
        return
    }
    util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}
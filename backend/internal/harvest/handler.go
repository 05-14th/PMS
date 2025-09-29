// File: backend/internal/harvest/handler.go
package harvest

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
	router.Get("/api/harvested-products", h.getHarvestedInventory)
	router.Get("/api/product-types", h.getProductTypes)
	router.Get("/api/batch-list", h.getBatchList)
	router.Get("/api/harvested-products/summary", h.getHarvestedSummary)
	router.Post("/api/harvests", h.createHarvest) 

	router.Delete("/api/harvest-products/{id}", h.deleteHarvestProduct)
}

func (h *Handler) getHarvestedInventory(w http.ResponseWriter, r *http.Request) {
	productType := r.URL.Query().Get("productType")
	batchID := r.URL.Query().Get("batchId")

	inventory, err := h.service.GetHarvestedInventory(r.Context(), productType, batchID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch harvested inventory", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, inventory)
}

func (h *Handler) getProductTypes(w http.ResponseWriter, r *http.Request) {
	types, err := h.service.GetProductTypes(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch product types", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, types)
}

func (h *Handler) getBatchList(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.GetBatchList(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch batch list", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, list)
}

func (h *Handler) getHarvestedSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.service.GetHarvestedSummary(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch harvested summary", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, summary)
}

func (h *Handler) createHarvest(w http.ResponseWriter, r *http.Request) {
	var payload models.HarvestPayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	harvestID, err := h.service.CreateHarvest(r.Context(), payload)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to create harvest", err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "harvestId": harvestID})
}

func (h *Handler) deleteHarvestProduct(w http.ResponseWriter, r *http.Request) {
	harvestProductIDStr := chi.URLParam(r, "id")
	harvestProductID, err := strconv.Atoi(harvestProductIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid harvest product ID", err)
		return
	}

	err = h.service.DeleteHarvestProduct(r.Context(), harvestProductID)
	if err != nil {
		// Check for our specific business rule error
		if err.Error() == "cannot delete a harvested product that is already part of a sale" {
			util.HandleError(w, http.StatusConflict, err.Error(), err) // 409 Conflict is a good status code here
		} else {
			util.HandleError(w, http.StatusInternalServerError, "Failed to delete harvest product", err)
		}
		return
	}

	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}
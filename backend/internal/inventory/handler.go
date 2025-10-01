// File: backend/internal/inventory/handler.go
package inventory

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

// RegisterRoutes sets up all the inventory-related endpoints.
func (h *Handler) RegisterRoutes(router *chi.Mux) {
	// CLEANUP: Removed duplicate /api/stock-items route.
	// The router now correctly points to a single handler for each action.
	router.Get("/api/items", h.getItems)
	router.Post("/api/items", h.createItem)
	router.Put("/api/items/{id}", h.updateItem)
	router.Delete("/api/items/{id}", h.deleteItem)
	
	router.Get("/api/purchase-history/{id}", h.getPurchaseHistory)
	router.Post("/api/purchases", h.createPurchase)
	router.Put("/api/purchases/{id}", h.updatePurchase)
	router.Delete("/api/purchases/{id}", h.deletePurchase)

	router.Post("/api/stock-items", h.createStockItem)
	router.Get("/api/stock-levels", h.getStockLevels)

	router.Get("/api/categories", h.getCategories)
	router.Get("/api/units", h.getUnits)
	router.Get("/api/subcategories", h.getSubCategories)
}

func (h *Handler) createStockItem(w http.ResponseWriter, r *http.Request) {
	var payload models.NewStockItemPayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	itemID, err := h.service.CreateStockItem(r.Context(), payload)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedItemId": itemID})
}

func (h *Handler) createItem(w http.ResponseWriter, r *http.Request) {
	var payload models.InventoryItem
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	itemID, err := h.service.CreateItem(r.Context(), payload)
	if err != nil {
		// FIXED: Changed status to 400 for validation errors.
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": itemID})
}

func (h *Handler) updateItem(w http.ResponseWriter, r *http.Request) {
	itemID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var payload models.InventoryItem
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	err := h.service.UpdateItem(r.Context(), payload, itemID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// --- ALL OTHER HANDLER FUNCTIONS BELOW ARE STANDARD AND CORRECT ---

func (h *Handler) getItems(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	items, err := h.service.GetItems(r.Context(), category)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch inventory items", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, items)
}

func (h *Handler) getPurchaseHistory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	itemID, err := strconv.Atoi(idStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid item ID", err)
		return
	}
	history, err := h.service.GetPurchaseHistory(r.Context(), itemID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch purchase history", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, history)
}

func (h *Handler) createPurchase(w http.ResponseWriter, r *http.Request) {
	var payload models.PurchasePayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	purchaseID, err := h.service.CreatePurchase(r.Context(), payload)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to create purchase", err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": purchaseID})
}

func (h *Handler) getStockLevels(w http.ResponseWriter, r *http.Request) {
	levels, err := h.service.GetStockLevels(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch stock levels", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, levels)
}

func (h *Handler) getCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.service.GetCategories(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch categories", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, categories)
}

func (h *Handler) getUnits(w http.ResponseWriter, r *http.Request) {
	units, err := h.service.GetUnits(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch units", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, units)
}

func (h *Handler) getSubCategories(w http.ResponseWriter, r *http.Request) {
	subCategories, err := h.service.GetSubCategories(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch subcategories", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, subCategories)
}

func (h *Handler) deleteItem(w http.ResponseWriter, r *http.Request) {
	itemID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	err := h.service.DeleteItem(r.Context(), itemID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func (h *Handler) updatePurchase(w http.ResponseWriter, r *http.Request) {
	purchaseID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var payload models.PurchasePayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}
	err := h.service.UpdatePurchase(r.Context(), payload, purchaseID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func (h *Handler) deletePurchase(w http.ResponseWriter, r *http.Request) {
	purchaseID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	err := h.service.DeletePurchase(r.Context(), purchaseID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}
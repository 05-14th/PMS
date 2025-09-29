// File: backend/internal/inventory/handler.go
package inventory

import (
	"chickmate-api/internal/models"
	"chickmate-api/internal/util"
	"context"
	"fmt"
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
	router.Get("/api/items", h.getItems)
	router.Get("/api/purchase-history/{id}", h.getPurchaseHistory)
	router.Post("/api/purchases", h.createPurchase)
	router.Post("/api/stock-items", h.createNewStockItem)
	router.Get("/api/stock-levels", h.getStockLevels)
	router.Get("/api/categories", h.getCategories)
	router.Get("/api/units", h.getUnits)
}

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

func (h *Handler) createNewStockItem(w http.ResponseWriter, r *http.Request) {
	var payload models.NewStockItemPayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	itemID, err := h.service.CreateNewStockItem(r.Context(), payload)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to create new stock item", err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedItemId": itemID})
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

func (r *Repository) DeleteUsage(ctx context.Context, usageID int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Find all the original purchases that this usage event drew from.
	type reversalDetail struct {
		PurchaseID    int
		QuantityDrawn float64
	}
	var details []reversalDetail

	rows, err := tx.QueryContext(ctx, "SELECT PurchaseID, QuantityDrawn FROM cm_inventory_usage_details WHERE UsageID = ?", usageID)
	if err != nil {
		return fmt.Errorf("failed to find usage details for reversal: %w", err)
	}
	
	for rows.Next() {
		var d reversalDetail
		if err := rows.Scan(&d.PurchaseID, &d.QuantityDrawn); err != nil {
			rows.Close()
			return err
		}
		details = append(details, d)
	}
	rows.Close()

	// 2. Add the quantities back to the original purchases.
	for _, d := range details {
		_, err = tx.ExecContext(ctx, "UPDATE cm_inventory_purchases SET QuantityRemaining = QuantityRemaining + ? WHERE PurchaseID = ?", d.QuantityDrawn, d.PurchaseID)
		if err != nil {
			return fmt.Errorf("failed to restore inventory stock: %w", err)
		}
	}

	// 3. Delete the usage records.
	if _, err := tx.ExecContext(ctx, "DELETE FROM cm_inventory_usage_details WHERE UsageID = ?", usageID); err != nil {
		return fmt.Errorf("failed to delete usage details: %w", err)
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM cm_inventory_usage WHERE UsageID = ?", usageID); err != nil {
		return fmt.Errorf("failed to delete usage record: %w", err)
	}

	return tx.Commit()
}
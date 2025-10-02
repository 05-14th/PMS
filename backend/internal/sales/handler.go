// File: backend/internal/sales/handler.go
package sales

import (
	"chickmate-api/internal/models"
	"chickmate-api/internal/util"
	"database/sql"
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

	router.Post("/api/direct-sales", h.createDirectSale)

	router.Get("/api/debug/harvest-products", h.debugAllHarvestProducts) // debugger
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

// In sales/handler.go - Add this method
func (h *Handler) createDirectSale(w http.ResponseWriter, r *http.Request) {
    var payload models.DirectSalePayload
    if !util.DecodeJSONBody(w, r, &payload) {
        return
    }

    saleID, err := h.service.CreateDirectSale(r.Context(), payload)
    if err != nil {
        util.HandleError(w, http.StatusBadRequest, err.Error(), err)
        return
    }
    
    util.RespondJSON(w, http.StatusCreated, map[string]interface{}{
        "success": true, 
        "saleID": saleID,
        "message": "Direct sale completed successfully",
    })
}

// In sales/handler.go - Add this debug endpoint
func (h *Handler) debugAllHarvestProducts(w http.ResponseWriter, r *http.Request) {
    query := `
        SELECT 
            hp.HarvestProductID,
            h.HarvestDate,
            hp.ProductType,
            hp.QuantityHarvested,
            hp.QuantityRemaining,
            hp.WeightHarvestedKg,
            hp.WeightRemainingKg,
            b.BatchName,
            hp.IsActive
        FROM cm_harvest_products hp
        LEFT JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
        LEFT JOIN cm_batches b ON h.BatchID = b.BatchID
        ORDER BY hp.HarvestProductID`

    rows, err := h.service.repo.db.QueryContext(r.Context(), query)
    if err != nil {
        util.RespondJSON(w, http.StatusInternalServerError, map[string]interface{}{
            "error": err.Error(),
        })
        return
    }
    defer rows.Close()

    type HarvestProductDebug struct {
        HarvestProductID int     `json:"harvestProductID"`
        HarvestDate      string  `json:"harvestDate"`
        ProductType      string  `json:"productType"`
        QuantityHarvested int    `json:"quantityHarvested"`
        QuantityRemaining int    `json:"quantityRemaining"`
        WeightHarvestedKg float64 `json:"weightHarvestedKg"`
        WeightRemainingKg float64 `json:"weightRemainingKg"`
        BatchName        string  `json:"batchName"`
        IsActive         bool    `json:"isActive"`
    }
    
    var products []HarvestProductDebug
    for rows.Next() {
        var p HarvestProductDebug
        var isActive int
        var harvestDate, productType, batchName sql.NullString
        
        err := rows.Scan(
            &p.HarvestProductID,
            &harvestDate,
            &productType,
            &p.QuantityHarvested,
            &p.QuantityRemaining,
            &p.WeightHarvestedKg,
            &p.WeightRemainingKg,
            &batchName,
            &isActive,
        )
        if err != nil {
            util.RespondJSON(w, http.StatusInternalServerError, map[string]interface{}{
                "error": err.Error(),
            })
            return
        }
        
        p.HarvestDate = harvestDate.String
        p.ProductType = productType.String
        p.BatchName = batchName.String
        p.IsActive = isActive == 1
        
        products = append(products, p)
    }

    util.RespondJSON(w, http.StatusOK, map[string]interface{}{
        "total_products": len(products),
        "products": products,
    })
}

// Register it in your RegisterRoutes method:


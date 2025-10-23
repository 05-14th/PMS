// File: backend/internal/batch/handler.go
package batch

import (
	"chickmate-api/internal/models" // We still need models for decoding JSON
	"chickmate-api/internal/util"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// Handler manages the HTTP requests for batches.
type Handler struct {
	service *Service
}

// NewHandler creates a new batch handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes sets up the routing for the batch feature.
func (h *Handler) RegisterRoutes(router *chi.Mux) {
	// Routes for the general list of batches
	router.Get("/api/batches", h.getBatches)
	router.Post("/api/batches", h.createBatch)

	router.Get("/api/batches/active", h.getActiveBatches)

	// Group routes for a specific batch under /api/batches/{id}
	router.Route("/api/batches/{id}", func(r chi.Router) {
		r.Get("/vitals", h.getBatchVitals)
		r.Get("/costs", h.getBatchCosts)
		r.Get("/events", h.getBatchEvents)
		r.Post("/costs", h.createDirectCost)
		r.Get("/harvest-products", h.getHarvestsForBatch)
		r.Get("/transactions", h.getBatchTransactions)
		r.Put("/", h.updateBatch)     
		r.Delete("/", h.deleteBatch) 
	})
	// Route for deleting events
	router.Delete("/api/events/{type}/{id}", h.deleteEvent)
	// Route for recording mortality
	router.Post("/api/mortality", h.createMortality)
	// Route for recording inventory usage
	router.Post("/api/usage", h.createUsage)
}

func (h *Handler) getBatches(w http.ResponseWriter, r *http.Request) {
	// The handler is responsible for getting data from the request.
	searchTerm := r.URL.Query().Get("search")
	statusFilter := r.URL.Query().Get("status")

	// The handler calls the service.
	batches, err := h.service.GetBatches(r.Context(), searchTerm, statusFilter)
	if err != nil {
		http.Error(w, "Failed to fetch batches", http.StatusInternalServerError)
		return
	}

	// The handler is responsible for sending the response.
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(batches)
}

func (h *Handler) createBatch(w http.ResponseWriter, r *http.Request) {
	var payload models.NewBatchPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	batchID, err := h.service.CreateBatch(r.Context(), payload)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest) // Send back validation errors
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "insertedId": batchID})
}

func (h *Handler) getBatchVitals(w http.ResponseWriter, r *http.Request) {
	batchIDStr := chi.URLParam(r, "id")
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	vitals, err := h.service.GetBatchVitals(r.Context(), batchID)
	if err != nil {
		util.HandleError(w, http.StatusNotFound, "Batch not found or failed to fetch vitals", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, vitals)
}

func (h *Handler) getBatchCosts(w http.ResponseWriter, r *http.Request) {
	batchIDStr := chi.URLParam(r, "id")
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	costs, err := h.service.GetBatchCosts(r.Context(), batchID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch batch costs", err)
		return
	}

	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"data": costs})
}

func (h *Handler) getBatchEvents(w http.ResponseWriter, r *http.Request) {
	batchIDStr := chi.URLParam(r, "id")
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	events, err := h.service.GetBatchEvents(r.Context(), batchID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch batch events", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"data": events})
}

func (h *Handler) createDirectCost(w http.ResponseWriter, r *http.Request) {
	batchIDStr := chi.URLParam(r, "id")
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	var payload models.DirectCostPayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	costID, err := h.service.CreateDirectCost(r.Context(), batchID, payload)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to create direct cost", err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": costID})
}

func (h *Handler) deleteEvent(w http.ResponseWriter, r *http.Request) {
	eventType := chi.URLParam(r, "type")
	eventIDStr := chi.URLParam(r, "id")
	eventID, err := strconv.Atoi(eventIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid event ID", err)
		return
	}

	if err := h.service.DeleteEvent(r.Context(), eventType, eventID); err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to delete event", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func (h *Handler) getHarvestsForBatch(w http.ResponseWriter, r *http.Request) {
	batchIDStr := chi.URLParam(r, "id")
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	products, err := h.service.GetHarvestsForBatch(r.Context(), batchID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch harvests for batch", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, products)
}

func (h *Handler) createMortality(w http.ResponseWriter, r *http.Request) {
	var payload models.MortalityPayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	mortalityID, err := h.service.CreateMortality(r.Context(), payload)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to record mortality", err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": mortalityID})
}

func (h *Handler) createUsage(w http.ResponseWriter, r *http.Request) {
	var payload models.InventoryUsagePayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	usageID, err := h.service.CreateUsage(r.Context(), payload)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to record consumption", err)
		return
	}
	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": usageID})
}

func (h *Handler) getBatchTransactions(w http.ResponseWriter, r *http.Request) {
	batchIDStr := chi.URLParam(r, "id")
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	transactions, err := h.service.GetBatchTransactions(r.Context(), batchID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch batch transactions", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, transactions)
}

func (h *Handler) updateBatch(w http.ResponseWriter, r *http.Request) {
	batchID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var payload models.UpdateBatchPayload
	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	err := h.service.UpdateBatch(r.Context(), payload, batchID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func (h *Handler) deleteBatch(w http.ResponseWriter, r *http.Request) {
	batchID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	err := h.service.DeleteBatch(r.Context(), batchID)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func (h *Handler) getActiveBatches(w http.ResponseWriter, r *http.Request) {
	batches, err := h.service.GetActiveBatches(r.Context())
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch active batches", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, batches)
}
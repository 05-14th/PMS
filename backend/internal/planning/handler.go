// File: backend/internal/planning/handler.go
package planning

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
	router.Post("/api/planning/procurement-plan", h.generateProcurementPlan)
}

func (h *Handler) generateProcurementPlan(w http.ResponseWriter, r *http.Request) {
    var payload struct {
        BatchID      int `json:"batchID"` // <-- New field
        ChickenCount int `json:"chickenCount"`
        DurationDays int `json:"durationDays"`
    }
    if !util.DecodeJSONBody(w, r, &payload) { return }

    // New safety check
    status, err := h.service.GetBatchStatus(r.Context(), payload.BatchID)
    if err != nil {
        util.HandleError(w, http.StatusNotFound, "Batch not found", err)
        return
    }
    if status == "Sold" {
        util.HandleError(w, http.StatusBadRequest, "Cannot generate a plan for a completed batch.", nil)
        return
    }

    plan, err := h.service.GenerateProcurementPlan(r.Context(), payload.ChickenCount, payload.DurationDays)
    if err != nil {
        util.HandleError(w, http.StatusInternalServerError, "Failed to generate procurement plan", err)
        return
    }
    util.RespondJSON(w, http.StatusOK, plan)
}
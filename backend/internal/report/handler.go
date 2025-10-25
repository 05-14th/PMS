// File: backend/internal/report/handler.go
package report

import (
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
	router.Get("/api/reports/batch/{id}", h.getBatchReport)
	router.Get("/api/batches/{id}/transactions", h.getBatchTransactions)
}

func (h *Handler) getBatchReport(w http.ResponseWriter, r *http.Request) {
	batchIDStr := chi.URLParam(r, "id")
	if batchIDStr == "all" || batchIDStr == "" {
		util.RespondJSON(w, http.StatusOK, nil) // Return empty if no batch is selected
		return
	}
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	report, err := h.service.GenerateBatchReport(r.Context(), batchID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to generate batch report", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, report)
}

func (h *Handler) getBatchTransactions(w http.ResponseWriter, r *http.Request) {
	batchIDStr := chi.URLParam(r, "id")
	if batchIDStr == "all" || batchIDStr == "" {
		util.RespondJSON(w, http.StatusOK, []interface{}{}) // Return empty array
		return
	}
	
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		util.HandleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	transactions, err := h.service.GetBatchTransactions(r.Context(), batchID)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to fetch transactions", err)
		return
	}
	util.RespondJSON(w, http.StatusOK, transactions)
}
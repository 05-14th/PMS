// File: backend/internal/device/handler.go
package device

import (
	"chickmate-api/internal/models"
	"chickmate-api/internal/util"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes sets up the IoT API endpoints.
func (h *Handler) RegisterRoutes(router chi.Router) {
	// Route for sensor data (from the Arduino/ESP32)
	router.Post("/api/dht22-data", h.handleDhtData) 
	
	// Route for device management (registration/listing)
	router.Route("/api/iot", func(r chi.Router) {
		r.Handle("/manageDevices", http.HandlerFunc(h.handleDeviceManagement))
	})
}

// handleDhtData handles POST /api/dht22-data
func (h *Handler) handleDhtData(w http.ResponseWriter, r *http.Request) {
	var data models.DhtData
	if !util.DecodeJSONBody(w, r, &data) {
		return
	}

	id, err := h.service.ProcessDhtData(r.Context(), data)
	if err != nil {
		util.HandleError(w, http.StatusInternalServerError, "Failed to insert temperature data", err)
		return
	}

	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"id":      id,
		"message": "Data received successfully",
	})
}

// handleDeviceManagement handles GET and POST for /api/iot/manageDevices
func (h *Handler) handleDeviceManagement(w http.ResponseWriter, r *http.Request) {
	// Note: CORS headers are applied globally via middleware.

	switch r.Method {
	case http.MethodPost:
		var req models.DeviceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.HandleError(w, http.StatusBadRequest, "Invalid JSON body", err)
			return
		}

		if err := h.service.RegisterDevice(r.Context(), req); err != nil {
			util.HandleError(w, http.StatusBadRequest, err.Error(), nil)
			return
		}

		util.RespondJSON(w, http.StatusCreated, map[string]any{
			"message": "Device added successfully",
			"device":  req,
		})

	case http.MethodGet:
		// Optional filter by ipAddress: /api/iot/manageDevices?ipAddress=192.168.1.10
		ip := r.URL.Query().Get("ipAddress")

		list, err := h.service.GetDevices(r.Context(), ip)
		if err != nil {
			util.HandleError(w, http.StatusInternalServerError, "Failed to fetch devices", err)
			return
		}
		
		if list == nil && ip != "" {
			util.HandleError(w, http.StatusNotFound, "device not found", nil)
			return
		}

		if list == nil {
			list = make([]models.Device, 0) // Ensure empty slice for JSON array
		}
		util.RespondJSON(w, http.StatusOK, list)

	default:
		util.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
	}
}
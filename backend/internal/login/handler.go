// File: backend/internal/login/handler.go
package login

import (
	"net/http"

	"chickmate-api/internal/util"

	"github.com/go-chi/chi/v5"
)


type Handler struct {
	service *Service
}


func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router chi.Router) {
	router.Post("/api/login", h.handleLogin)
}


func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	

	if !util.DecodeJSONBody(w, r, &payload) {
		return
	}

	role, err := h.service.AuthenticateUser(r.Context(), payload.Username, payload.Password)
	if err != nil {
	
		util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	
	util.RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "role": role})
}
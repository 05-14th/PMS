package gateway

import (
	"chickmate-api/internal/models"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

type Handler struct {
	svc *Service
	up  websocket.Upgrader
}

func NewHandler(svc *Service) *Handler {
	return &Handler{
		svc: svc,
		up:  websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }},
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	// Gateways connect here
	r.Get("/ws/gateway", h.wsGateway)

	// Frontend commands the feeder through a gateway
	r.Post("/api/gateways/{id}/command", h.postCommand)
	r.Post("/api/iot/gateways/{id}/command", h.postCommand)

	// Frontend discovers feeder behind a gateway
	r.Get("/api/iot/gateways/{id}/discover/feeder", h.getDiscoverFeeder)
}

func (h *Handler) wsGateway(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	ws, err := h.up.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "upgrade failed", http.StatusBadRequest)
		return
	}
	gc := &models.GatewayConn{ID: id, WS: ws}
	NewRepository() // no
	// note: repo is on handler.svc, so:
	h.svc.repo.Put(gc)
	log.Printf("Gateway connected: %s", id)
	defer func() {
		h.svc.repo.Remove(id)
		ws.Close()
		log.Printf("Gateway disconnected: %s", id)
	}()
	for {
		typ, data, err := ws.ReadMessage()
		if err != nil {
			return
		}
		if typ == websocket.TextMessage {
			log.Printf("From %s: %s", id, string(data))
		}
	}
}

type proxyPayload struct {
	Proxy *struct {
		Method    string            `json:"method"`
		URL       string            `json:"url"`
		Headers   map[string]string `json:"headers,omitempty"`
		Body      any               `json:"body,omitempty"`
		TimeoutMS int               `json:"timeout_ms,omitempty"`
	} `json:"proxy,omitempty"`
	Command *map[string]any `json:"command,omitempty"`
}

func (h *Handler) postCommand(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	body, _ := io.ReadAll(r.Body)
	var req proxyPayload
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	switch {
	case req.Proxy != nil:
		resp, err := h.svc.SendProxy(id, req.Proxy, 10*time.Second)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		writeJSON(w, resp)
	case req.Command != nil:
		if err := h.svc.SendCommand(id, *req.Command); err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		writeJSON(w, map[string]string{"status": "ok"})
	default:
		http.Error(w, "missing proxy or command", http.StatusBadRequest)
	}
}

func (h *Handler) getDiscoverFeeder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	resp, err := h.svc.DiscoverFeeder(id, 8*time.Second)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	writeJSON(w, resp)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

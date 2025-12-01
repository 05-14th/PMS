package device

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type HTTPHandler struct {
	svc Service
}

func NewHTTPHandler(svc Service) *HTTPHandler {
	return &HTTPHandler{svc: svc}
}

func (h *HTTPHandler) RegisterRoutes(r chi.Router) {
	// Inventory
	r.HandleFunc("/", h.getRoot)
	// Device registration and uploads
	r.HandleFunc("/hello", h.postHello)
	r.HandleFunc("/upload", h.postUpload)
	// Command queue
	r.HandleFunc("/command/", h.postCommand)
	r.HandleFunc("/next", h.getNext)
	r.HandleFunc("/ack", h.postAck)
	// Feeder control passthrough
	// Watering system control passthroughs
	r.HandleFunc("/mode/", h.modeHandler)
	r.HandleFunc("/set-relays/", h.setRelaysHandler)
	// Cached telemetry and live status view
	r.HandleFunc("/telemetry/", h.getTelemetryCached)
	r.HandleFunc("/status/", h.getStatusPassthrough)
	r.Post("/push/{deviceID}", h.postPush)
}

/* utility helpers */

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func parseJSON(r *http.Request, dst any) error {
	b, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	defer r.Body.Close()
	return json.Unmarshal(b, dst)
}

func getClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		ip := strings.TrimSpace(parts[0])
		if ip != "" {
			return ip
		}
	}
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil {
		return host
	}
	return strings.TrimSpace(r.RemoteAddr)
}

func normalizeMode(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	switch s {
	case "auto", "automatic":
		return "automatic"
	case "manual":
		return "manual"
	default:
		return s
	}
}

// forwards a request to a known device IP and returns its response verbatim
func (h *HTTPHandler) passthroughToDevice(devID, method, path string, body []byte) (int, []byte, error) {
	d, err := h.svc.GetDevice(devID)
	if err != nil || d == nil || d.IP == "" {
		return http.StatusNotFound, nil, fmt.Errorf("unknown device or no IP")
	}

	url := fmt.Sprintf("http://%s%s", d.IP, path)
	req, err := http.NewRequest(method, url, bytes.NewReader(body))
	if err != nil {
		return http.StatusInternalServerError, nil, fmt.Errorf("build request failed")
	}
	if len(body) > 0 {
		req.Header.Set("Content-Type", "application/json")
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return http.StatusBadGateway, nil, fmt.Errorf("forward failed: %v", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, respBody, nil
}

/* handlers */

// Root shows devices and cached context
func (h *HTTPHandler) getRoot(w http.ResponseWriter, r *http.Request) {
	type DevView struct {
		ID          string             `json:"id"`
		IP          string             `json:"ip"`
		LastHello   time.Time          `json:"last_hello"`
		QueueLen    int                `json:"queue_len"`
		LastSensors map[string]float64 `json:"last_sensors,omitempty"`
		Mode        string             `json:"mode,omitempty"`
		Relays      [3]int             `json:"relays,omitempty"`
	}

	devs, err := h.svc.ListDevices()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	out := make([]DevView, 0, len(devs))
	for _, d := range devs {
		out = append(out, DevView{
			ID:          d.ID,
			IP:          d.IP,
			LastHello:   d.LastHello,
			QueueLen:    h.svc.GetQueueLen(d.ID),
			LastSensors: d.LastSensors,
			Mode:        d.Mode,
			Relays:      d.Relays,
		})
	}
	writeJSON(w, map[string]any{"devices": out})
}

// Device says hello so we can learn its IP
func (h *HTTPHandler) postHello(w http.ResponseWriter, r *http.Request) {
	var msg struct {
		ID string `json:"id"`
	}
	if err := parseJSON(r, &msg); err != nil || msg.ID == "" {
		http.Error(w, "bad json or missing id", http.StatusBadRequest)
		return
	}
	ip := getClientIP(r)

	if _, err := h.svc.RegisterHello(msg.ID, ip); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"ok": true, "ip": ip})
}

// Device uploads sensor readings
func (h *HTTPHandler) postUpload(w http.ResponseWriter, r *http.Request) {
	var raw map[string]interface{}
	if err := parseJSON(r, &raw); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	id, _ := raw["id"].(string)
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	// build sensor map from payload (same logic as original)
	sensorMap := map[string]float64{}
	if s, ok := raw["sensors"].(map[string]interface{}); ok {
		for k, v := range s {
			switch t := v.(type) {
			case float64:
				sensorMap[k] = t
			case string:
				if f, err := strconv.ParseFloat(t, 64); err == nil {
					sensorMap[k] = f
				}
			}
		}
	} else {
		for k, v := range raw {
			if strings.HasPrefix(k, "sensor") {
				switch t := v.(type) {
				case float64:
					sensorMap[k] = t
				case string:
					if f, err := strconv.ParseFloat(t, 64); err == nil {
						sensorMap[k] = f
					}
				}
			}
		}
	}

	ip := getClientIP(r)
	if _, _, err := h.svc.HandleUpload(id, ip, sensorMap, raw); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"ok": true})
}

// Command queue compatibility
func (h *HTTPHandler) postCommand(w http.ResponseWriter, r *http.Request) {
	dev := chi.URLParam(r, "/command/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}
	var c Command
	if err := parseJSON(r, &c); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}

	cmd, err := h.svc.EnqueueCommand(dev, c)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"enqueued": true, "cmd_id": cmd.CmdID})
}

func (h *HTTPHandler) getNext(w http.ResponseWriter, r *http.Request) {
	dev := r.URL.Query().Get("dev")
	if dev == "" {
		http.Error(w, "missing dev", http.StatusBadRequest)
		return
	}
	items, err := h.svc.GetNextCommands(dev)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"cmds": items})
}

func (h *HTTPHandler) postAck(w http.ResponseWriter, r *http.Request) {
	var a struct {
		ID    string `json:"id"`
		CmdID string `json:"cmd_id"`
		OK    bool   `json:"ok"`
	}
	if err := parseJSON(r, &a); err != nil || a.ID == "" || a.CmdID == "" {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	if err := h.svc.AckCommand(a.ID, a.CmdID, a.OK); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"ok": true})
}

// Feeder push passthrough to device /rotate-servo
func (h *HTTPHandler) postPush(w http.ResponseWriter, r *http.Request) {
	dev := chi.URLParam(r, "deviceID")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}

	// Expect {"degrees":90|120|180, "pulse_ms":optional}
	var payload struct {
		Degrees int `json:"degrees"`
		PulseMs int `json:"pulse_ms"`
	}

	if err := parseJSON(r, &payload); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	if payload.Degrees == 0 {
		http.Error(w, "missing degrees", http.StatusBadRequest)
		return
	}
	if payload.PulseMs == 0 {
		payload.PulseMs = 1000
	}

	devMu.RLock()
	d, ok := devices[dev]
	devMu.RUnlock()

	if !ok || d.IP == "" {
		http.Error(w, "unknown device or no IP", http.StatusBadRequest)
		return
	}

	body := map[string]any{
		"degrees":  payload.Degrees,
		"pulse_ms": payload.PulseMs,
	}
	b, _ := json.Marshal(body)

	url := fmt.Sprintf("http://%s/rotate-servo", d.IP)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		http.Error(w, "push build failed", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "push failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

// Watering system: /mode/{id} -> forwards to device /mode
func (h *HTTPHandler) modeHandler(w http.ResponseWriter, r *http.Request) {
	dev := chi.URLParam(r, "/mode/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}

	d, err := h.svc.GetDevice(dev)
	if err != nil || d == nil || d.IP == "" {
		http.Error(w, "unknown device or no IP", http.StatusNotFound)
		return
	}

	targetURL := fmt.Sprintf("http://%s/mode", d.IP)

	var req *http.Request

	switch r.Method {
	case http.MethodGet:
		req, err = http.NewRequest(http.MethodGet, targetURL, nil)
	case http.MethodPost:
		bodyBytes, readErr := io.ReadAll(r.Body)
		if readErr != nil {
			http.Error(w, "bad request body", http.StatusBadRequest)
			return
		}
		_ = r.Body.Close()

		var payload map[string]interface{}
		_ = json.Unmarshal(bodyBytes, &payload)
		if m, ok := payload["mode"].(string); ok {
			m = normalizeMode(m)
			if err := h.svc.UpdateMode(dev, m); err != nil {
				log.Printf("failed to update mode cache: %v", err)
			}
			payload["mode"] = m
			bodyBytes, _ = json.Marshal(payload)
		}

		req, err = http.NewRequest(http.MethodPost, targetURL, bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err != nil {
		http.Error(w, "build request failed", http.StatusInternalServerError)
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "forward failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

// Watering system: POST /set-relays/{id} -> forwards to device /set-relays
// Accepts optional {"mode":"manual"|"automatic"} and relay1..relay3 ints
func (h *HTTPHandler) setRelaysHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	dev := chi.URLParam(r, "/set-relays/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}

	d, err := h.svc.GetDevice(dev)
	if err != nil || d == nil || d.IP == "" {
		http.Error(w, "unknown device or no IP", http.StatusNotFound)
		return
	}
	url := fmt.Sprintf("http://%s/set-relays", d.IP)

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "bad request body", http.StatusBadRequest)
		return
	}
	_ = r.Body.Close()

	var payload map[string]interface{}
	_ = json.Unmarshal(bodyBytes, &payload)

	modeStr := ""
	if m, ok := payload["mode"].(string); ok {
		modeStr = normalizeMode(m)
		payload["mode"] = modeStr
	}

	var relays [3]int
	if v, ok := payload["relay1"].(float64); ok {
		relays[0] = int(v)
	}
	if v, ok := payload["relay2"].(float64); ok {
		relays[1] = int(v)
	}
	if v, ok := payload["relay3"].(float64); ok {
		relays[2] = int(v)
	}

	if err := h.svc.UpdateModeAndRelays(dev, modeStr, relays); err != nil {
		log.Printf("failed to update relay cache: %v", err)
	}

	bodyBytes, _ = json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		http.Error(w, "build request failed", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "forward failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

// Return last known telemetry that came via /upload
func (h *HTTPHandler) getTelemetryCached(w http.ResponseWriter, r *http.Request) {
	dev := chi.URLParam(r, "/telemetry/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}
	d, err := h.svc.GetTelemetry(dev)
	if err != nil {
		http.Error(w, "unknown device", http.StatusNotFound)
		return
	}
	writeJSON(w, map[string]any{
		"id":           d.ID,
		"ip":           d.IP,
		"last_hello":   d.LastHello,
		"last_sensors": d.LastSensors,
		"mode":         d.Mode,
		"relays":       d.Relays,
	})
}

// GET /status/{id} -> forwards to device GET /status
func (h *HTTPHandler) getStatusPassthrough(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	dev := chi.URLParam(r, "/status/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}
	code, body, err := h.passthroughToDevice(dev, http.MethodGet, "/status", nil)
	if err != nil {
		http.Error(w, err.Error(), code)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write(body)
}

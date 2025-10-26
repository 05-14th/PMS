// main.go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Device now tracks last sensors and watering state
type Device struct {
	ID          string
	IP          string
	LastHello   time.Time
	LastSensors map[string]float64 // from /upload
	Mode        string             // "automatic" or "manual"
	Relays      [3]int             // relay1..relay3
}

type Command struct {
	CmdID   string                 `json:"cmd_id"`
	Type    string                 `json:"type"`     // "rotate"
	Relay   int                    `json:"relay"`    // 1..3
	OpenDeg int                    `json:"open_deg"` // default 120 here
	PulseMs int                    `json:"pulse_ms"` // default 1000
	Meta    map[string]interface{} `json:"meta,omitempty"`
}

type Upload struct {
	ID      string                 `json:"id"`
	Sensors map[string]float64     `json:"sensors"`
	Raw     map[string]interface{} `json:"-"`
	Time    time.Time              `json:"time"`
}

var (
	devMu    sync.RWMutex
	devices  = map[string]*Device{}
	qMu      sync.Mutex
	queues   = map[string][]Command{}
	inflight = map[string]map[string]bool{}
)

// ---------- utility helpers ----------

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
func passthroughToDevice(devID, method, path string, body []byte) (int, []byte, error) {
	devMu.RLock()
	d := devices[devID]
	devMu.RUnlock()
	if d == nil || d.IP == "" {
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

// ---------- handlers ----------

// Root shows devices and cached context
func getRoot(w http.ResponseWriter, r *http.Request) {
	type DevView struct {
		ID          string             `json:"id"`
		IP          string             `json:"ip"`
		LastHello   time.Time          `json:"last_hello"`
		QueueLen    int                `json:"queue_len"`
		LastSensors map[string]float64 `json:"last_sensors,omitempty"`
		Mode        string             `json:"mode,omitempty"`
		Relays      [3]int             `json:"relays,omitempty"`
	}
	out := make([]DevView, 0, len(devices))
	devMu.RLock()
	qMu.Lock()
	for id, d := range devices {
		out = append(out, DevView{
			ID:          id,
			IP:          d.IP,
			LastHello:   d.LastHello,
			QueueLen:    len(queues[id]),
			LastSensors: d.LastSensors,
			Mode:        d.Mode,
			Relays:      d.Relays,
		})
	}
	qMu.Unlock()
	devMu.RUnlock()
	writeJSON(w, map[string]any{"devices": out})
}

// Device says hello so we can learn its IP
func postHello(w http.ResponseWriter, r *http.Request) {
	var msg struct {
		ID string `json:"id"`
	}
	if err := parseJSON(r, &msg); err != nil || msg.ID == "" {
		http.Error(w, "bad json or missing id", http.StatusBadRequest)
		return
	}
	ip := getClientIP(r)
	devMu.Lock()
	d := devices[msg.ID]
	if d == nil {
		d = &Device{ID: msg.ID}
		devices[msg.ID] = d
	}
	d.IP = ip
	d.LastHello = time.Now()
	devMu.Unlock()
	writeJSON(w, map[string]any{"ok": true, "ip": ip})
}

// Device uploads sensor readings
func postUpload(w http.ResponseWriter, r *http.Request) {
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
		// flat legacy keys like sensor1, sensor2
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
	devMu.Lock()
	d := devices[id]
	if d == nil {
		d = &Device{ID: id}
		devices[id] = d
	}
	d.IP = ip
	d.LastHello = time.Now()
	// keep last sensors
	if len(sensorMap) > 0 {
		if d.LastSensors == nil {
			d.LastSensors = map[string]float64{}
		}
		for k, v := range sensorMap {
			d.LastSensors[k] = v
		}
		// infer relays if present as floats in sensors
		if v, ok := d.LastSensors["relay1"]; ok {
			d.Relays[0] = int(v)
		}
		if v, ok := d.LastSensors["relay2"]; ok {
			d.Relays[1] = int(v)
		}
		if v, ok := d.LastSensors["relay3"]; ok {
			d.Relays[2] = int(v)
		}
	}
	devMu.Unlock()

	up := Upload{
		ID:      id,
		Sensors: sensorMap,
		Raw:     raw,
		Time:    time.Now(),
	}
	log.Printf("upload from %s sensors=%v", up.ID, up.Sensors)
	writeJSON(w, map[string]any{"ok": true})
}

// Command queue compatibility
func postCommand(w http.ResponseWriter, r *http.Request) {
	dev := strings.TrimPrefix(r.URL.Path, "/command/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}
	var c Command
	if err := parseJSON(r, &c); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	if c.CmdID == "" {
		c.CmdID = fmt.Sprintf("%s-%d", dev, time.Now().UnixNano())
	}
	if c.Type == "" {
		c.Type = "rotate"
	}
	if c.OpenDeg == 0 {
		c.OpenDeg = 120
	}
	if c.PulseMs == 0 {
		c.PulseMs = 1000
	}

	qMu.Lock()
	queues[dev] = append(queues[dev], c)
	if inflight[dev] == nil {
		inflight[dev] = map[string]bool{}
	}
	inflight[dev][c.CmdID] = true
	qMu.Unlock()

	writeJSON(w, map[string]any{"enqueued": true, "cmd_id": c.CmdID})
}

func getNext(w http.ResponseWriter, r *http.Request) {
	dev := r.URL.Query().Get("dev")
	if dev == "" {
		http.Error(w, "missing dev", http.StatusBadRequest)
		return
	}
	qMu.Lock()
	items := queues[dev]
	queues[dev] = nil
	qMu.Unlock()
	writeJSON(w, map[string]any{"cmds": items})
}

func postAck(w http.ResponseWriter, r *http.Request) {
	var a struct {
		ID    string `json:"id"`
		CmdID string `json:"cmd_id"`
		OK    bool   `json:"ok"`
	}
	if err := parseJSON(r, &a); err != nil || a.ID == "" || a.CmdID == "" {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	qMu.Lock()
	if inflight[a.ID] != nil {
		delete(inflight[a.ID], a.CmdID)
	}
	qMu.Unlock()
	log.Printf("ack from %s cmd=%s ok=%v", a.ID, a.CmdID, a.OK)
	writeJSON(w, map[string]any{"ok": true})
}

// Feeder push passthrough to device /rotate-servo
func postPush(w http.ResponseWriter, r *http.Request) {
	dev := strings.TrimPrefix(r.URL.Path, "/push/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}
	var c Command
	if err := parseJSON(r, &c); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	if c.Type == "" {
		c.Type = "rotate"
	}
	if c.OpenDeg == 0 {
		c.OpenDeg = 120
	}
	if c.PulseMs == 0 {
		c.PulseMs = 1000
	}

	devMu.RLock()
	d := devices[dev]
	devMu.RUnlock()
	if d == nil || d.IP == "" {
		http.Error(w, "unknown device or no IP", http.StatusNotFound)
		return
	}

	body := map[string]any{
		"relay":    c.Relay,
		"pulse_ms": c.PulseMs,
	}
	b, _ := json.Marshal(body)
	url := fmt.Sprintf("http://%s/rotate-servo", d.IP)

	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(string(b)))
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
func modeHandler(w http.ResponseWriter, r *http.Request) {
	dev := strings.TrimPrefix(r.URL.Path, "/mode/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}

	devMu.RLock()
	d := devices[dev]
	devMu.RUnlock()
	if d == nil || d.IP == "" {
		http.Error(w, "unknown device or no IP", http.StatusNotFound)
		return
	}

	targetURL := fmt.Sprintf("http://%s/mode", d.IP)

	var req *http.Request
	var err error

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

		// normalize and cache intended mode
		var payload map[string]interface{}
		_ = json.Unmarshal(bodyBytes, &payload)
		if m, ok := payload["mode"].(string); ok {
			m = normalizeMode(m)
			devMu.Lock()
			if d := devices[dev]; d != nil {
				d.Mode = m
			}
			devMu.Unlock()
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
func setRelaysHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	dev := strings.TrimPrefix(r.URL.Path, "/set-relays/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}

	devMu.RLock()
	d := devices[dev]
	devMu.RUnlock()
	if d == nil || d.IP == "" {
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

	// update cached state from intended payload and normalize mode
	var payload map[string]interface{}
	_ = json.Unmarshal(bodyBytes, &payload)
	devMu.Lock()
	if d := devices[dev]; d != nil {
		if m, ok := payload["mode"].(string); ok {
			d.Mode = normalizeMode(m)
			payload["mode"] = d.Mode
		}
		if v, ok := payload["relay1"].(float64); ok {
			d.Relays[0] = int(v)
		}
		if v, ok := payload["relay2"].(float64); ok {
			d.Relays[1] = int(v)
		}
		if v, ok := payload["relay3"].(float64); ok {
			d.Relays[2] = int(v)
		}
	}
	devMu.Unlock()
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
func getTelemetryCached(w http.ResponseWriter, r *http.Request) {
	dev := strings.TrimPrefix(r.URL.Path, "/telemetry/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}
	devMu.RLock()
	d := devices[dev]
	devMu.RUnlock()
	if d == nil {
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
func getStatusPassthrough(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	dev := strings.TrimPrefix(r.URL.Path, "/status/")
	if dev == "" {
		http.Error(w, "missing device id", http.StatusBadRequest)
		return
	}
	code, body, err := passthroughToDevice(dev, http.MethodGet, "/status", nil)
	if err != nil {
		http.Error(w, err.Error(), code)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write(body)
}

// CORS wrapper for all routes
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Change "*" to your UI origin if you want to restrict
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func main() {
	addr := ":8080"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}

	mux := http.NewServeMux()
	// Inventory
	mux.HandleFunc("/", getRoot)
	// Device registration and uploads
	mux.HandleFunc("/hello", postHello)
	mux.HandleFunc("/upload", postUpload)
	// Command queue compatibility
	mux.HandleFunc("/command/", postCommand)
	mux.HandleFunc("/next", getNext)
	mux.HandleFunc("/ack", postAck)
	// Feeder control passthrough
	mux.HandleFunc("/push/", postPush)
	// Watering system control passthroughs
	mux.HandleFunc("/mode/", modeHandler)
	mux.HandleFunc("/set-relays/", setRelaysHandler)
	// Cached telemetry and live status view
	mux.HandleFunc("/telemetry/", getTelemetryCached)
	mux.HandleFunc("/status/", getStatusPassthrough)

	srv := &http.Server{
		Addr:              addr,
		Handler:           withCORS(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("server listening on %s", addr)
	log.Fatal(srv.ListenAndServe())
}

// main.go
package main

import (
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

type Device struct {
	ID        string
	IP        string
	LastHello time.Time
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

func getRoot(w http.ResponseWriter, r *http.Request) {
	type DevView struct {
		ID        string    `json:"id"`
		IP        string    `json:"ip"`
		LastHello time.Time `json:"last_hello"`
		QueueLen  int       `json:"queue_len"`
	}
	out := make([]DevView, 0)
	devMu.RLock()
	qMu.Lock()
	for id, d := range devices {
		out = append(out, DevView{
			ID:        id,
			IP:        d.IP,
			LastHello: d.LastHello,
			QueueLen:  len(queues[id]),
		})
	}
	qMu.Unlock()
	devMu.RUnlock()
	writeJSON(w, map[string]any{"devices": out})
}

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

	req, err := http.NewRequest("POST", url, strings.NewReader(string(b)))
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
	io.Copy(w, resp.Body)
}

// GET or POST mode for a device. Forwards to device /mode.
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
		req, err = http.NewRequest(http.MethodPost, targetURL, strings.NewReader(string(bodyBytes)))
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
	io.Copy(w, resp.Body)
}

// Simple CORS wrapper for all routes
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If you need to restrict, replace "*" with "http://localhost:5173"
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			// Preflight
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
	mux.HandleFunc("/", getRoot)
	mux.HandleFunc("/hello", postHello)
	mux.HandleFunc("/upload", postUpload)
	mux.HandleFunc("/command/", postCommand)
	mux.HandleFunc("/next", getNext)
	mux.HandleFunc("/ack", postAck)
	mux.HandleFunc("/push/", postPush)
	mux.HandleFunc("/mode/", modeHandler)

	srv := &http.Server{
		Addr:              addr,
		Handler:           withCORS(mux), // wrap all routes with CORS
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("server listening on %s", addr)
	log.Fatal(srv.ListenAndServe())
}

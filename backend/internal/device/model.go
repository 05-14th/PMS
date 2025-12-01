package device

import (
	"sync"
	"time"
)

// Device now tracks last sensors and watering state
type Device struct {
	ID          string
	IP          string
	LastHello   time.Time
	LastSensors map[string]float64
	Mode        string
	Relays      [3]int
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
	devMu   sync.RWMutex
	devices map[string]Device
)

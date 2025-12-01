package device

import (
	"errors"
	"sync"
)

type memoryRepository struct {
	mu       sync.RWMutex
	devices  map[string]*Device
	queues   map[string][]Command
	inflight map[string]map[string]bool
}

func NewMemoryRepository() Repository {
	return &memoryRepository{
		devices:  make(map[string]*Device),
		queues:   make(map[string][]Command),
		inflight: make(map[string]map[string]bool),
	}
}

func (r *memoryRepository) UpsertDevice(d *Device) error {
	if d == nil || d.ID == "" {
		return errors.New("invalid device")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.devices[d.ID] = d
	return nil
}

func (r *memoryRepository) GetDevice(id string) (*Device, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	d, ok := r.devices[id]
	if !ok {
		return nil, errors.New("device not found")
	}
	return d, nil
}

func (r *memoryRepository) ListDevices() ([]*Device, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	out := make([]*Device, 0, len(r.devices))
	for _, d := range r.devices {
		out = append(out, d)
	}
	return out, nil
}

func (r *memoryRepository) EnqueueCommand(deviceID string, cmd Command) error {
	if deviceID == "" {
		return errors.New("device id required")
	}
	if cmd.CmdID == "" {
		return errors.New("cmd id required")
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	r.queues[deviceID] = append(r.queues[deviceID], cmd)
	if r.inflight[deviceID] == nil {
		r.inflight[deviceID] = make(map[string]bool)
	}
	r.inflight[deviceID][cmd.CmdID] = true
	return nil
}

func (r *memoryRepository) GetAndClearCommands(deviceID string) []Command {
	r.mu.Lock()
	defer r.mu.Unlock()

	items := r.queues[deviceID]
	// clear queue
	r.queues[deviceID] = nil
	return items
}

func (r *memoryRepository) AckCommand(deviceID, cmdID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.inflight[deviceID] != nil {
		delete(r.inflight[deviceID], cmdID)
	}
	return nil
}

func (r *memoryRepository) GetQueueLen(deviceID string) int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.queues[deviceID])
}

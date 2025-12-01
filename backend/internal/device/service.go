package device

import (
	"errors"
	"log"
	"time"
)

type Service interface {
	ListDevices() ([]*Device, error)

	RegisterHello(id, ip string) (*Device, error)
	HandleUpload(id, ip string, sensors map[string]float64, raw map[string]interface{}) (*Upload, *Device, error)

	EnqueueCommand(deviceID string, cmd Command) (Command, error)
	GetNextCommands(deviceID string) ([]Command, error)
	AckCommand(deviceID, cmdID string, ok bool) error

	GetTelemetry(deviceID string) (*Device, error)
	GetDevice(deviceID string) (*Device, error)

	UpdateMode(deviceID, mode string) error
	UpdateModeAndRelays(deviceID string, mode string, relays [3]int) error

	GetQueueLen(deviceID string) int
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListDevices() ([]*Device, error) {
	return s.repo.ListDevices()
}

func (s *service) RegisterHello(id, ip string) (*Device, error) {
	if id == "" {
		return nil, errors.New("missing id")
	}
	d, err := s.repo.GetDevice(id)
	if err != nil {
		// treat as new device
		d = &Device{
			ID: id,
		}
	}
	d.IP = ip
	d.LastHello = time.Now()
	if err := s.repo.UpsertDevice(d); err != nil {
		return nil, err
	}
	return d, nil
}

func (s *service) HandleUpload(id, ip string, sensors map[string]float64, raw map[string]interface{}) (*Upload, *Device, error) {
	if id == "" {
		return nil, nil, errors.New("missing id")
	}

	d, err := s.repo.GetDevice(id)
	if err != nil {
		d = &Device{ID: id}
	}
	d.IP = ip
	d.LastHello = time.Now()

	if len(sensors) > 0 {
		if d.LastSensors == nil {
			d.LastSensors = make(map[string]float64)
		}
		for k, v := range sensors {
			d.LastSensors[k] = v
		}
		// infer relays from sensor map
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

	if err := s.repo.UpsertDevice(d); err != nil {
		return nil, nil, err
	}

	up := &Upload{
		ID:      id,
		Sensors: sensors,
		Raw:     raw,
		Time:    time.Now(),
	}

	log.Printf("upload from %s sensors=%v", up.ID, up.Sensors)
	return up, d, nil
}

func (s *service) EnqueueCommand(deviceID string, cmd Command) (Command, error) {
	if deviceID == "" {
		return cmd, errors.New("device id required")
	}
	// fill defaults if needed
	if cmd.CmdID == "" {
		cmd.CmdID = deviceID + "-" + time.Now().Format("20060102150405.000000000")
	}
	if cmd.Type == "" {
		cmd.Type = "rotate"
	}
	if cmd.OpenDeg == 0 {
		cmd.OpenDeg = 120
	}
	if cmd.PulseMs == 0 {
		cmd.PulseMs = 1000
	}

	if err := s.repo.EnqueueCommand(deviceID, cmd); err != nil {
		return cmd, err
	}
	return cmd, nil
}

func (s *service) GetNextCommands(deviceID string) ([]Command, error) {
	if deviceID == "" {
		return nil, errors.New("device id required")
	}
	cmds := s.repo.GetAndClearCommands(deviceID)
	return cmds, nil
}

func (s *service) AckCommand(deviceID, cmdID string, ok bool) error {
	if deviceID == "" || cmdID == "" {
		return errors.New("missing id or cmd_id")
	}
	if err := s.repo.AckCommand(deviceID, cmdID); err != nil {
		return err
	}
	log.Printf("ack from %s cmd=%s ok=%v", deviceID, cmdID, ok)
	return nil
}

func (s *service) GetTelemetry(deviceID string) (*Device, error) {
	return s.repo.GetDevice(deviceID)
}

func (s *service) GetDevice(deviceID string) (*Device, error) {
	return s.repo.GetDevice(deviceID)
}

func (s *service) UpdateMode(deviceID, mode string) error {
	d, err := s.repo.GetDevice(deviceID)
	if err != nil {
		return err
	}
	d.Mode = mode
	return s.repo.UpsertDevice(d)
}

func (s *service) UpdateModeAndRelays(deviceID string, mode string, relays [3]int) error {
	d, err := s.repo.GetDevice(deviceID)
	if err != nil {
		return err
	}
	if mode != "" {
		d.Mode = mode
	}
	d.Relays = relays
	return s.repo.UpsertDevice(d)
}

func (s *service) GetQueueLen(deviceID string) int {
	return s.repo.GetQueueLen(deviceID)
}

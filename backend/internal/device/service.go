// File: backend/internal/device/service.go
package device

import (
	"chickmate-api/internal/models"
	"context"
	"fmt"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// RegisterDevice registers a new IoT device.
func (s *Service) RegisterDevice(ctx context.Context, req models.DeviceRequest) error {
	if req.IPAddress == "" || req.DeviceType == "" {
		return fmt.Errorf("IP address and device type are required")
	}
	device := models.Device{
		IPAddress:  req.IPAddress,
		DeviceType: req.DeviceType,
	}
	return s.repo.RegisterDevice(ctx, device)
}

// GetDevices fetches registered devices.
func (s *Service) GetDevices(ctx context.Context, ip string) ([]models.Device, error) {
	return s.repo.GetRegisteredDevices(ctx, ip)
}

// ProcessDhtData validates and saves sensor telemetry data.
func (s *Service) ProcessDhtData(ctx context.Context, data models.DhtData) (int64, error) {
	if data.CageNum == 0 {
		return 0, fmt.Errorf("cage_num is required")
	}
	// Add further validation here if needed (e.g., bounds checking for temp/humidity)
	
	return s.repo.SaveDhtData(ctx, data)
}
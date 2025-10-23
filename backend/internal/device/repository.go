// File: backend/internal/device/repository.go
package device

import (
	"chickmate-api/internal/models"
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"sync"
	"time"
)

type Repository struct {
	db *sql.DB

	devicesMu sync.RWMutex
	devices   map[string]models.Device 
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{
		db:        db,
		devices:   make(map[string]models.Device),
	}
}

func (r *Repository) RegisterDevice(ctx context.Context, device models.Device) error {
	if net.ParseIP(device.IPAddress) == nil {
		return fmt.Errorf("IP address is invalid")
	}
	
	r.devicesMu.Lock()
	r.devices[device.IPAddress] = device
	r.devicesMu.Unlock()
	return nil
}


func (r *Repository) GetRegisteredDevices(ctx context.Context, ip string) ([]models.Device, error) {
	r.devicesMu.RLock()
	defer r.devicesMu.RUnlock()

	if ip != "" {
		if d, ok := r.devices[ip]; ok {
			return []models.Device{d}, nil
		}
		return nil, nil 
	}

	list := make([]models.Device, 0, len(r.devices))
	for _, d := range r.devices {
		list = append(list, d)
	}
	return list, nil
}


func (r *Repository) SaveDhtData(ctx context.Context, data models.DhtData) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	const limitPerCage = 10
	cleanupStmt := `DELETE FROM cm_temperature WHERE temp_id NOT IN (SELECT temp_id FROM (SELECT temp_id FROM cm_temperature WHERE temp_cage_num = ? ORDER BY created_at DESC LIMIT ?) AS keep);`

	if _, err := r.db.ExecContext(ctx, cleanupStmt, data.CageNum, limitPerCage); err != nil {
		log.Printf("Warning: Failed to cleanup old temperature data: %v", err)
	}

	stmt := `INSERT INTO cm_temperature (temp_temperature, temp_humidity, gas_sensor, temp_cage_num) VALUES (?, ?, ?, ?)`
	res, err := r.db.ExecContext(ctx, stmt, data.Temperature, data.Humidity, data.GasSensor, data.CageNum)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	return id, err
}
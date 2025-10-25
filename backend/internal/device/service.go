package gateway

import (
	"chickmate-api/internal/models"
	"encoding/json"
	"errors"
	"time"
)

type Service struct{ repo *Repository }

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) SendProxy(gatewayID string, proxy any, timeout time.Duration) (map[string]any, error) {
	gc, ok := s.repo.Get(gatewayID)
	if !ok {
		return nil, errors.New("gateway offline")
	}
	msg := map[string]any{
		"type": "proxy",
		"data": proxy,
		"ts":   time.Now().Unix(),
		"cid":  time.Now().UnixNano(),
	}
	return requestReply(gc, msg, timeout)
}

func (s *Service) DiscoverFeeder(gatewayID string, timeout time.Duration) (map[string]any, error) {
	gc, ok := s.repo.Get(gatewayID)
	if !ok {
		return nil, errors.New("gateway offline")
	}
	msg := map[string]any{
		"type": "discover",
		"what": "feeder",
		"ts":   time.Now().Unix(),
		"cid":  time.Now().UnixNano(),
	}
	return requestReply(gc, msg, timeout)
}

func (s *Service) SendCommand(gatewayID string, command map[string]any) error {
	gc, ok := s.repo.Get(gatewayID)
	if !ok {
		return errors.New("gateway offline")
	}
	command["type"] = "command"
	command["ts"] = time.Now().Unix()
	return writeWS(gc, command)
}

// helpers shared by handlers
func requestReply(gc *models.GatewayConn, msg map[string]any, timeout time.Duration) (map[string]any, error) {
	b, _ := json.Marshal(msg)
	gc.Mu.Lock()
	err := gc.WS.WriteMessage(1, b)
	gc.Mu.Unlock()
	if err != nil {
		return nil, err
	}
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		gc.WS.SetReadDeadline(time.Now().Add(2 * time.Second))
		typ, data, err := gc.WS.ReadMessage()
		if err != nil {
			continue
		}
		if typ == 1 {
			var res map[string]any
			if json.Unmarshal(data, &res) == nil {
				return res, nil
			}
		}
	}
	return nil, errors.New("timeout")
}

func writeWS(gc *models.GatewayConn, msg map[string]any) error {
	b, _ := json.Marshal(msg)
	gc.Mu.Lock()
	defer gc.Mu.Unlock()
	return gc.WS.WriteMessage(1, b)
}

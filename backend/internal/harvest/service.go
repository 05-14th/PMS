// File: backend/internal/harvest/service.go
package harvest

import (
	"chickmate-api/internal/models"
	"context"
	"errors"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetHarvestedInventory(ctx context.Context, productType, batchID string) ([]models.HarvestedInventoryItem, error) {
	return s.repo.GetHarvestedInventory(ctx, productType, batchID)
}

func (s *Service) GetProductTypes(ctx context.Context) ([]string, error) {
	return s.repo.GetProductTypes(ctx)
}

func (s *Service) GetBatchList(ctx context.Context) ([]map[string]interface{}, error) {
	return s.repo.GetBatchList(ctx)
}


func (s *Service) GetHarvestedSummary(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetHarvestedSummary(ctx)
}

func (s *Service) CreateHarvest(ctx context.Context, payload models.HarvestPayload) (int64, error) {
	// Add validation here, e.g., check if quantity or weight are positive
	if payload.QuantityHarvested <= 0 || payload.TotalWeightKg <= 0 {
		return 0, errors.New("quantity and weight must be positive")
	}
	return s.repo.CreateHarvest(ctx, payload)
}

func (s *Service) DeleteHarvestProduct(ctx context.Context, harvestProductID int) error {
	return s.repo.DeleteHarvestProduct(ctx, harvestProductID)
}
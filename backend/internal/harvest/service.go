// File: backend/internal/harvest/service.go
package harvest

import (
	"chickmate-api/internal/models"
	"context"
	"errors"
	"strings"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetHarvestedProductsByBatch(ctx context.Context, batchID int) ([]models.HarvestedInventoryItem, error) {
	// Simple passthrough since the repository function handles the logic
	return s.repo.GetHarvestedProductsByBatch(ctx, batchID)
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

func (s *Service) CreateByproducts(ctx context.Context, payload models.ProcessPayload) (int64, error) {
	if payload.QuantityToProcess <= 0 {
		return 0, errors.New("quantity to process must be greater than zero")
	}
	if len(payload.Yields) == 0 {
		return 0, errors.New("must have at least one byproduct yield")
	}
	return s.repo.CreateByproducts(ctx, payload)
}

func (s *Service) AddProductType(ctx context.Context, newType string) error {
	if newType == "" {
		return errors.New("new product type name cannot be empty")
	}
	return s.repo.AddProductType(ctx, newType)
}

func (s *Service) GetProductTypeUsage(ctx context.Context) ([]string, error) {
	return s.repo.GetProductTypeUsage(ctx)
}

func (s *Service) DeleteProductType(ctx context.Context, typeToDelete string) error {
	if typeToDelete == "" { return errors.New("product type to delete cannot be empty") }
	if strings.EqualFold(typeToDelete, "Live") || strings.EqualFold(typeToDelete, "Dressed") {
		return errors.New("cannot delete core product types 'Live' or 'Dressed'")
	}
	return s.repo.DeleteProductType(ctx, typeToDelete)
}


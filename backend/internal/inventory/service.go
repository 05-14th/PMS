// File: backend/internal/inventory/service.go
package inventory

import (
	"chickmate-api/internal/models"
	"context"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Most of these service methods pass directly to the repository for now.
// Business logic can be added here later as needed.
func (s *Service) GetItems(ctx context.Context, category string) ([]models.InventoryItem, error) {
	return s.repo.GetItems(ctx, category)
}

func (s *Service) GetPurchaseHistory(ctx context.Context, itemID int) ([]models.PurchaseHistoryDetail, error) {
	return s.repo.GetPurchaseHistory(ctx, itemID)
}

func (s *Service) CreatePurchase(ctx context.Context, p models.PurchasePayload) (int64, error) {
	// Add any validation logic for the purchase payload here
	return s.repo.CreatePurchase(ctx, p)
}

func (s *Service) CreateNewStockItem(ctx context.Context, payload models.NewStockItemPayload) (int64, error) {
	// Add validation logic for the new stock item payload here
	return s.repo.CreateNewStockItem(ctx, payload)
}


func (s *Service) GetStockLevels(ctx context.Context) ([]models.StockLevelSummary, error) {
	return s.repo.GetStockLevels(ctx)
}

func (s *Service) GetCategories(ctx context.Context) ([]string, error) {
	return s.repo.GetCategories(ctx)
}

func (s *Service) GetUnits(ctx context.Context) ([]string, error) {
	return s.repo.GetUnits(ctx)
}

func (s *Service) DeleteUsage(ctx context.Context, usageID int) error {
	return s.repo.DeleteUsage(ctx, usageID)
}
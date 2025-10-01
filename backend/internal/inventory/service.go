// File: backend/internal/inventory/service.go
package inventory

import (
	"chickmate-api/internal/models"
	"context"
	"errors"
	"fmt"
	"strings"
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

func (s *Service) CreateItem(ctx context.Context, item models.InventoryItem) (int64, error) {
	// VALIDATION LOGIC
	if strings.TrimSpace(item.ItemName) == "" {
		return 0, errors.New("item name cannot be empty")
	}
	if strings.TrimSpace(item.Category) == "" {
		return 0, errors.New("item category cannot be empty")
	}
	if strings.TrimSpace(item.Unit) == "" {
		return 0, errors.New("item unit cannot be empty")
	}
	return s.repo.CreateItem(ctx, item)
}

func (s *Service) UpdateItem(ctx context.Context, item models.InventoryItem, itemID int) error {
	// VALIDATION LOGIC
	if strings.TrimSpace(item.ItemName) == "" {
		return errors.New("item name cannot be empty")
	}
	if strings.TrimSpace(item.Category) == "" {
		return errors.New("item category cannot be empty")
	}
	if strings.TrimSpace(item.Unit) == "" {
		return errors.New("item unit cannot be empty")
	}
	return s.repo.UpdateItem(ctx, item, itemID)
}

func (s *Service) DeleteItem(ctx context.Context, itemID int) error {
	// BUSINESS RULE: You cannot archive an item that still has stock.
	totalStock, err := s.repo.GetTotalStockForItem(ctx, itemID)
	if err != nil {
		return err
	}
	if totalStock > 0 {
		return fmt.Errorf("cannot archive item with %.2f remaining in stock", totalStock)
	}
	return s.repo.DeleteItem(ctx, itemID)
}

func (s *Service) UpdatePurchase(ctx context.Context, p models.PurchasePayload, purchaseID int) error {
	// BUSINESS RULE: Cannot edit a purchase that has been partially used.
	used, err := s.repo.IsPurchaseUsed(ctx, purchaseID)
	if err != nil {
		return err
	}
	if used {
		return errors.New("cannot edit a purchase that has been partially used")
	}
	return s.repo.UpdatePurchase(ctx, p, purchaseID)
}

func (s *Service) DeletePurchase(ctx context.Context, purchaseID int) error {
	// BUSINESS RULE: Cannot delete a purchase that has been partially used.
	used, err := s.repo.IsPurchaseUsed(ctx, purchaseID)
	if err != nil {
		return err
	}
	if used {
		return errors.New("cannot delete a purchase that has been partially used")
	}
	return s.repo.DeletePurchase(ctx, purchaseID)
}

func (s *Service) CreateStockItem(ctx context.Context, payload models.NewStockItemPayload) (int64, error) {
	// VALIDATION LOGIC
	if strings.TrimSpace(payload.ItemName) == "" {
		return 0, errors.New("item name cannot be empty")
	}
	if payload.ExistingSupplierID == nil && (payload.NewSupplierName == nil || strings.TrimSpace(*payload.NewSupplierName) == "") {
		return 0, errors.New("a supplier must be selected or a new supplier name must be provided")
	}
	if payload.QuantityPurchased <= 0 {
		return 0, errors.New("quantity purchased must be greater than zero")
	}

	return s.repo.CreateStockItem(ctx, payload)
}
// File: backend/internal/sales/service.go
package sales

import (
	"chickmate-api/internal/models"
	"context"
	"errors"
	"fmt"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// CreatePreOrder handles the business logic for creating a pre-order.
func (s *Service) CreatePreOrder(ctx context.Context, payload models.SalePayload) (int64, error) {
	// Business Logic: Check if the batch can fulfill the order quantity.
	batches, err := s.repo.GetActiveBatchesForSale(ctx)
	if err != nil {
		return 0, err
	}

	var targetBatch *models.BatchForSale
	for i, b := range batches {
		if b.BatchID == payload.BatchID {
			targetBatch = &batches[i]
			break
		}
	}

	if targetBatch == nil {
		return 0, errors.New("selected batch is not active or does not exist")
	}

	totalOrderedQty := 0
	for _, item := range payload.Items {
		totalOrderedQty += item.QuantitySold
	}

	// MODIFIED: Use CurrentChicken for the availability calculation
	availableQty := targetBatch.CurrentChicken - targetBatch.PreOrderedChicken
	if totalOrderedQty > availableQty {
		return 0, errors.New("insufficient quantity available in the selected batch for pre-order")
	}

	return s.repo.CreatePreOrder(ctx, payload)
}

func (s *Service) FulfillOrder(ctx context.Context, saleID int, payload models.FulfillmentPayload) error {
	// Add any business logic here, e.g., checking if product weights are reasonable.
	return s.repo.FulfillOrder(ctx, saleID, payload)
}

func (s *Service) GetActiveBatchesForSale(ctx context.Context) ([]models.BatchForSale, error) {
	return s.repo.GetActiveBatchesForSale(ctx)
}

func (s *Service) GetSalesHistory(ctx context.Context) ([]models.SaleHistoryRecord, error) {
	return s.repo.GetSalesHistory(ctx)
}

func (s *Service) GetSaleDetails(ctx context.Context, saleID int) ([]models.SaleDetail, error) {
	return s.repo.GetSaleDetails(ctx, saleID)
}

func (s *Service) GetPaymentMethods(ctx context.Context) ([]string, error) {
	return s.repo.GetPaymentMethods(ctx)
}

func (s *Service) GetHarvestedProducts(ctx context.Context, productType string) ([]models.HarvestedProduct, error) { 
	return s.repo.GetHarvestedProducts(ctx, productType)
}

func (s *Service) VoidSale(ctx context.Context, saleID int) error {
    return s.repo.VoidSale(ctx, saleID)
}


func (s *Service) CreateDirectSale(ctx context.Context, payload models.DirectSalePayload) (int64, error) {
    // Business logic: Check if harvested products have sufficient quantity
    for _, item := range payload.Items {
        products, err := s.repo.GetHarvestedProducts(ctx, "")
        if err != nil {
            return 0, err
        }

        var targetProduct *models.HarvestedProduct
        for i, p := range products {
            if p.HarvestProductID == item.HarvestProductID {
                targetProduct = &products[i]
                break
            }
        }

        if targetProduct == nil {
            return 0, fmt.Errorf("harvested product with ID %d not found", item.HarvestProductID)
        }

        if item.QuantitySold > targetProduct.QuantityRemaining {
            return 0, fmt.Errorf("insufficient quantity for product %s. Available: %d, Requested: %d", 
                targetProduct.ProductType, targetProduct.QuantityRemaining, item.QuantitySold)
        }
    }

    return s.repo.CreateDirectSale(ctx, payload)
}
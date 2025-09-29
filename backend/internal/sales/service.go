// File: backend/internal/sales/service.go
package sales

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

func (s *Service) GetSalesHistory(ctx context.Context) ([]models.SaleHistoryRecord, error) {
	return s.repo.GetSalesHistory(ctx)
}

func (s *Service) GetAvailableProducts(ctx context.Context, productType string) ([]models.SaleProduct, error) {
	return s.repo.GetAvailableProducts(ctx, productType)
}

func (s *Service) GetSaleDetails(ctx context.Context, saleID int) ([]models.SaleDetailItem, error) {
	return s.repo.GetSaleDetails(ctx, saleID)
}

func (s *Service) CreateSale(ctx context.Context, payload models.SalePayload) (int64, error) {
	// This is BUSINESS LOGIC: calculate the total amount before saving.
	var totalAmount float64
	for _, item := range payload.Items {
		totalAmount += item.TotalWeightKg * item.PricePerKg
	}

	return s.repo.CreateSale(ctx, payload, totalAmount)
}

func (s *Service) GetPaymentMethods(ctx context.Context) ([]string, error) {
	return s.repo.GetPaymentMethods(ctx)
}
// File: backend/internal/supplier/service.go
package supplier

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

func (s *Service) GetSuppliers(ctx context.Context) ([]models.Supplier, error) {
	// For now, we just call the repository.
	// Later, business logic could be added here.
	return s.repo.GetSuppliers(ctx)
}


func (s *Service) CreateSupplier(ctx context.Context, sup models.Supplier) (int64, error) {
	if strings.TrimSpace(sup.SupplierName) == "" {
		return 0, errors.New("supplier name cannot be empty")
	}
	return s.repo.CreateSupplier(ctx, sup)
}

func (s *Service) UpdateSupplier(ctx context.Context, sup models.Supplier, supplierID int) error {
	if strings.TrimSpace(sup.SupplierName) == "" {
		return errors.New("supplier name cannot be empty")
	}
	return s.repo.UpdateSupplier(ctx, sup, supplierID)
}

func (s *Service) DeleteSupplier(ctx context.Context, supplierID int) error {
	// BUSINESS RULE: Check if the supplier has existing purchase records.
	hasRecords, err := s.repo.HasPurchaseRecords(ctx, supplierID)
	if err != nil {
		return fmt.Errorf("failed to check for purchase records: %w", err)
	}
	if hasRecords {
		return errors.New("cannot delete a supplier with existing purchase records")
	}
	return s.repo.DeleteSupplier(ctx, supplierID)
}
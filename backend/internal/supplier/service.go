// File: backend/internal/supplier/service.go
package supplier

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

func (s *Service) GetSuppliers(ctx context.Context) ([]models.Supplier, error) {
	// For now, we just call the repository.
	// Later, business logic could be added here.
	return s.repo.GetSuppliers(ctx)
}
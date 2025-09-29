// File: backend/internal/customer/service.go
package customer

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

func (s *Service) GetCustomers(ctx context.Context) ([]models.Customer, error) {
	return s.repo.GetCustomers(ctx)
}
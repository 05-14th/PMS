// File: backend/internal/customer/service.go
package customer

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

func (s *Service) GetCustomers(ctx context.Context) ([]models.Customer, error) {
	return s.repo.GetCustomers(ctx)
}

func (s *Service) CreateCustomer(ctx context.Context, cust models.Customer) (int64, error) {
	if strings.TrimSpace(cust.Name) == "" {
		return 0, errors.New("customer name cannot be empty")
	}
	return s.repo.CreateCustomer(ctx, cust)
}

func (s *Service) UpdateCustomer(ctx context.Context, cust models.Customer, customerID int) error {
	if strings.TrimSpace(cust.Name) == "" {
		return errors.New("customer name cannot be empty")
	}
	return s.repo.UpdateCustomer(ctx, cust, customerID)
}

func (s *Service) DeleteCustomer(ctx context.Context, customerID int) error {
	// BUSINESS RULE: Check if the customer has existing sales records.
	hasRecords, err := s.repo.HasSalesRecords(ctx, customerID)
	if err != nil {
		return fmt.Errorf("failed to check for sales records: %w", err)
	}
	if hasRecords {
		return errors.New("cannot delete a customer with existing sales records")
	}
	return s.repo.DeleteCustomer(ctx, customerID)
}
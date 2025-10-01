// File: backend/internal/batch/service.go
package batch

import (
	"chickmate-api/internal/inventory"
	"chickmate-api/internal/models"
	"context"
	"errors"
	"fmt"
	"strings"
)

// Service contains the business logic for the batch feature.
type Service struct {
	repo *Repository
	inventoryService *inventory.Service
}

// NewService creates a new batch service.
func NewService(repo *Repository, inventoryService *inventory.Service) *Service {
	return &Service{
		repo:             repo,
		inventoryService: inventoryService,
	}
}

// GetBatches forwards the request to the repository.
func (s *Service) GetBatches(ctx context.Context, searchTerm, statusFilter string) ([]models.Batch, error) {
	return s.repo.GetBatches(ctx, searchTerm, statusFilter)
}

// CreateBatch validates the payload and then calls the repository to create the batch.
func (s *Service) CreateBatch(ctx context.Context, payload models.NewBatchPayload) (int64, error) {
	// This is BUSINESS LOGIC. The service is responsible for validation.
	if payload.TotalChicken <= 0 {
		return 0, errors.New("total chicken must be greater than zero")
	}

	// If validation passes, call the repository.
	return s.repo.CreateBatch(ctx, payload)
}

func (s *Service) GetBatchVitals(ctx context.Context, batchID int) (*models.BatchVitals, error) {
	return s.repo.GetBatchVitals(ctx, batchID)
}

func (s *Service) GetBatchCosts(ctx context.Context, batchID int) ([]map[string]interface{}, error) {
	return s.repo.GetBatchCosts(ctx, batchID)
}

func (s *Service) GetBatchEvents(ctx context.Context, batchID int) ([]map[string]interface{}, error) {
	return s.repo.GetBatchEvents(ctx, batchID)
}

func (s *Service) CreateDirectCost(ctx context.Context, batchID int, payload models.DirectCostPayload) (int64, error) {

	/*if payload.Amount <= 0 {
		return 0, errors.New("cost amount must be greater than zero")
	}*/

	return s.repo.CreateDirectCost(ctx, batchID, payload)
}

func (s *Service) DeleteEvent(ctx context.Context, eventType string, eventID int) error {
	switch eventType {
	case "cost":
		return s.repo.DeleteCost(ctx, eventID)
	case "mortality":
		return s.repo.DeleteMortalityEvent(ctx, eventID)
	case "consumption": // <-- ADD THIS CASE
		// The Batch Service calls the Inventory Service to handle this
		return s.inventoryService.DeleteUsage(ctx, eventID)
	default:
		return fmt.Errorf("deleting event type '%s' is not supported", eventType)
	}
}

func (s *Service) GetHarvestsForBatch(ctx context.Context, batchID int) ([]models.HarvestedProduct, error) {
	return s.repo.GetHarvestsForBatch(ctx, batchID)
}

func (s *Service) CreateMortality(ctx context.Context, payload models.MortalityPayload) (int64, error) {
	// BUSINESS RULE: Validate the payload before attempting the database transaction.
	if payload.BirdsLoss <= 0 {
		return 0, errors.New("birds loss must be a positive number")
	}
	// Note: The check against current population happens inside the repository's transaction
	// to avoid race conditions, but this initial check is good practice.
	return s.repo.CreateMortality(ctx, payload)
}

func (s *Service) CreateUsage(ctx context.Context, payload models.InventoryUsagePayload) (int64, error) {
	if payload.QuantityUsed <= 0 {
		return 0, errors.New("quantity used must be a positive number")
	}
	return s.repo.CreateUsage(ctx, payload)
}

func (s *Service) GetBatchTransactions(ctx context.Context, batchID int) ([]models.Transaction, error) {
	return s.repo.GetBatchTransactions(ctx, batchID)
}

func (s *Service) UpdateBatch(ctx context.Context, p models.UpdateBatchPayload, batchID int) error {
	if strings.TrimSpace(p.BatchName) == "" {
		return errors.New("batch name cannot be empty")
	}
	return s.repo.UpdateBatch(ctx, p, batchID)
}

func (s *Service) DeleteBatch(ctx context.Context, batchID int) error {
	// The complex business rule is handled in the repository's transaction,
	// so the service just needs to call it.
	return s.repo.DeleteBatch(ctx, batchID)
}
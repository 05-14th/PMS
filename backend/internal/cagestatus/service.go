package cagestatus

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListActiveBatches(ctx context.Context) ([]ActiveBatch, error) {
	return s.repo.GetActiveBatches(ctx)
}

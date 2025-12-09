// File: backend/internal/register/service.go
package register

import (
	"chickmate-api/internal/models"
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

// Service contains the business logic for user registration.
type Service struct {
	repo *Repository
}

// NewService creates a new register service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// RegisterUser handles password hashing and calls the repository for insertion.
func (s *Service) RegisterUser(ctx context.Context, payload models.UserRegistrationPayload, profilePicPath string) error {
	// Business Rule: Validate role
	if payload.Role != "admin" && payload.Role != "user" {
		return errors.New("invalid role. Role must be either 'admin' or 'user'")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	return s.repo.CreateUser(ctx, payload, string(hashedPassword), profilePicPath)
}
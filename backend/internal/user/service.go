// File: backend/internal/user/service.go
package user

import (
	"chickmate-api/internal/models"
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

// Service contains the business logic for user accounts.
type Service struct {
	repo *Repository
}

// NewService creates a new user service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// AuthenticateUser retrieves credentials and validates the password.
func (s *Service) AuthenticateUser(ctx context.Context, username, password string) (string, error) {
	dbPassword, role, err := s.repo.GetUserCredentials(ctx, username)
	if err != nil {
		return "", errors.New("invalid username or password")
	}

	// Compare the stored hash with the provided password
	if bcrypt.CompareHashAndPassword([]byte(dbPassword), []byte(password)) != nil {
		return "", errors.New("invalid username or password")
	}

	// In a real application, you would generate a JWT token here
	return role, nil
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
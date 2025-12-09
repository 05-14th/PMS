// File: backend/internal/login/service.go
package login

import (
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

// Service contains the business logic for user authentication.
type Service struct {
	repo *Repository
}

// NewService creates a new login service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// AuthenticateUser retrieves credentials and validates the password.
// This logic is directly extracted from your previous user service.
func (s *Service) AuthenticateUser(ctx context.Context, username, password string) (string, error) {
	dbPassword, role, err := s.repo.GetUserCredentials(ctx, username)
	if err != nil {
		// Errors are generalized for security
		return "", errors.New("invalid username or password")
	}

	// Compare the stored hash with the provided password
	if bcrypt.CompareHashAndPassword([]byte(dbPassword), []byte(password)) != nil {
		return "", errors.New("invalid username or password")
	}

	// Login successful
	return role, nil
}
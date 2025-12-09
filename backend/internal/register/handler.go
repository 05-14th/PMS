// File: backend/internal/register/handler.go
package register

import (
	"chickmate-api/internal/models"
	"chickmate-api/internal/util"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
)

// Handler manages the HTTP requests for user registration.
type Handler struct {
	service *Service
}

// NewHandler creates a new handler instance.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes sets up the public route for user registration.
func (h *Handler) RegisterRoutes(router chi.Router) {
	// Public Auth Route
	router.Post("/api/register", h.register)
}

// register handles POST /api/register (multipart form)
func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	// 1. Parse multipart form data
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		util.HandleError(w, http.StatusBadRequest, "Failed to parse form data", err)
		return
	}

	// 2. Map form values to payload
	var payload models.UserRegistrationPayload
	payload.Username = r.FormValue("username")
	payload.FirstName = r.FormValue("firstName")
	payload.LastName = r.FormValue("lastName")
	payload.Suffix = r.FormValue("suffix")
	payload.Email = r.FormValue("email")
	payload.PhoneNumber = r.FormValue("phoneNumber")
	payload.Password = r.FormValue("password")
	payload.Role = r.FormValue("role")

	// 3. Handle profile picture upload
	var profilePicPath string
	file, header, err := r.FormFile("profilePic")
	if err == nil {
		defer file.Close()
		
		if err := os.MkdirAll("uploads/profile_pics", 0755); err != nil {
			util.HandleError(w, http.StatusInternalServerError, "Failed to create upload directory", err)
			return
		}

		ext := filepath.Ext(header.Filename)
		profilePicPath = filepath.Join("uploads/profile_pics", fmt.Sprintf("%d%s", time.Now().UnixNano(), ext))
		out, err := os.Create(profilePicPath)
		if err != nil {
			util.HandleError(w, http.StatusInternalServerError, "Failed to save profile picture", err)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			util.HandleError(w, http.StatusInternalServerError, "Failed to save profile picture", err)
			return
		}
	} else if !errors.Is(err, http.ErrMissingFile) {
		util.HandleError(w, http.StatusBadRequest, "Error processing profile picture upload", err)
		return
	}

	// 4. Call the service to register the user
	if err := h.service.RegisterUser(r.Context(), payload, profilePicPath); err != nil {
		// If registration failed and a file was saved, clean it up
		if profilePicPath != "" {
			os.Remove(profilePicPath) 
		}
		
		util.HandleError(w, http.StatusBadRequest, err.Error(), err)
		return
	}

	util.RespondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "message": "User registered successfully"})
}
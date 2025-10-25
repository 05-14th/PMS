// File: backend/internal/util/http.go
package util

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// We can define the models reference here if needed later, but for now these are generic.

func HandleError(w http.ResponseWriter, status int, clientMsg string, err error) {
	if err != nil {
		log.Printf("[ERROR] %s: %v", clientMsg, err)
	} else {
		log.Printf("[ERROR] %s", clientMsg)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	errResp := map[string]interface{}{
		"success": false,
		"error":   clientMsg,
	}
	if err != nil {
		errResp["details"] = err.Error()
	}
	_ = json.NewEncoder(w).Encode(errResp)
}

func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func DecodeJSONBody[T any](w http.ResponseWriter, r *http.Request, dst *T) bool {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		HandleError(w, http.StatusBadRequest, "Invalid JSON body", err)
		return false
	}
	return true
}

const DefaultQueryTimeout = 15 * time.Second

func WithTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, DefaultQueryTimeout)
}

func Cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("Access-Control-Allow-Origin", "*")
		h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
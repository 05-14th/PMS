// File: backend/cmd/api/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"chickmate-api/internal/batch"
	"chickmate-api/internal/customer"
	"chickmate-api/internal/dashboard"
	"chickmate-api/internal/database"
	"chickmate-api/internal/harvest"
	"chickmate-api/internal/inventory"
	"chickmate-api/internal/report"
	"chickmate-api/internal/sales"
	"chickmate-api/internal/supplier"
	"chickmate-api/internal/util"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func buildRouter(batchHandler *batch.Handler, supplierHandler *supplier.Handler, inventoryHandler *inventory.Handler, 
	harvestHandler *harvest.Handler, customerHandler *customer.Handler, salesHandler *sales.Handler, reportHandler *report.Handler,
	dashboardHandler *dashboard.Handler) http.Handler {
	r := chi.NewRouter()

	// Setup middleware from our new util package
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(util.Cors)

	// Handler routes
	batchHandler.RegisterRoutes(r)
	supplierHandler.RegisterRoutes(r)
	inventoryHandler.RegisterRoutes(r)
	harvestHandler.RegisterRoutes(r)
	customerHandler.RegisterRoutes(r)
	salesHandler.RegisterRoutes(r)
	reportHandler.RegisterRoutes(r)
	dashboardHandler.RegisterRoutes(r)
	
	/*
		// TODO: Refactor and re-enable these routes later
		r.Route("/api", func(r chi.Router) {
			r.Get("/dashboard", getDashboardData)
			r.Post("/dht22-data", handleDhtData)
			r.Post("/login", loginHandler)
			// ... and so on for all other routes ...
		})
	*/

	return r
}

func main() {
	database.InitDB()

	// Initialize layers for the inventory feature
	inventoryRepo := inventory.NewRepository(database.DB)
	inventoryService := inventory.NewService(inventoryRepo)
	inventoryHandler := inventory.NewHandler(inventoryService)

	// Initialize layers for the batch feature
	batchRepo := batch.NewRepository(database.DB)
	batchService := batch.NewService(batchRepo, inventoryService)
	batchHandler := batch.NewHandler(batchService)

	// Initialize layers for the supplier feature
	supplierRepo := supplier.NewRepository(database.DB)
	supplierService := supplier.NewService(supplierRepo)
	supplierHandler := supplier.NewHandler(supplierService)


	// Initialize layers for the harvest feature
	harvestRepo := harvest.NewRepository(database.DB)
	harvestService := harvest.NewService(harvestRepo)
	harvestHandler := harvest.NewHandler(harvestService)

	// Initialize layers for the customer feature
	customerRepo := customer.NewRepository(database.DB)
	customerService := customer.NewService(customerRepo)
	customerHandler := customer.NewHandler(customerService)

	// Initialize layers for the sales feature
	salesRepo := sales.NewRepository(database.DB)
	salesService := sales.NewService(salesRepo)
	salesHandler := sales.NewHandler(salesService)

	// Initialize layers for the report feature
	reportRepo := report.NewRepository(database.DB)
	reportService := report.NewService(reportRepo, batchRepo, salesRepo, inventoryRepo, harvestRepo)
	reportHandler := report.NewHandler(reportService)

	// Initialize layers for the dashboard feature
	dashboardService := dashboard.NewService(batchRepo, salesRepo, inventoryRepo, harvestRepo)
	dashboardHandler := dashboard.NewHandler(dashboardService)

	router := buildRouter(batchHandler, supplierHandler, inventoryHandler, harvestHandler, customerHandler, salesHandler, reportHandler, dashboardHandler)

	server := &http.Server{
		Addr:         "0.0.0.0:8080",
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown logic remains the same
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		fmt.Println("Server running at http://0.0.0.0:8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe error: %v", err)
		}
	}()

	<-ctx.Done()
	fmt.Println("Shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Shutdown error: %v", err)
	}
	fmt.Println("Shutdown complete.")
}


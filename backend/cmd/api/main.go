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
	"chickmate-api/internal/cagestatus"
	"chickmate-api/internal/customer"
	"chickmate-api/internal/dashboard"
	"chickmate-api/internal/database"
	"chickmate-api/internal/harvest"
	"chickmate-api/internal/inventory"
	"chickmate-api/internal/planning"
	"chickmate-api/internal/report"
	"chickmate-api/internal/sales"
	"chickmate-api/internal/supplier"
	"chickmate-api/internal/user"
	"chickmate-api/internal/util"

	gateway "chickmate-api/internal/device"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func buildRouter(
	userHandler *user.Handler,
	batchHandler *batch.Handler,
	supplierHandler *supplier.Handler,
	inventoryHandler *inventory.Handler,
	harvestHandler *harvest.Handler,
	customerHandler *customer.Handler,
	salesHandler *sales.Handler,
	reportHandler *report.Handler,
	dashboardHandler *dashboard.Handler,
	planningHandler *planning.Handler,
	cageStatusHandler *cagestatus.Handler,
	deviceHandler http.Handler,
) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(util.Cors)

	userHandler.RegisterRoutes(r)
	batchHandler.RegisterRoutes(r)
	supplierHandler.RegisterRoutes(r)
	inventoryHandler.RegisterRoutes(r)
	harvestHandler.RegisterRoutes(r)
	customerHandler.RegisterRoutes(r)
	salesHandler.RegisterRoutes(r)
	reportHandler.RegisterRoutes(r)
	dashboardHandler.RegisterRoutes(r)
	planningHandler.RegisterRoutes(r)
	cageStatusHandler.RegisterRoutes(r)

	r.Mount("/device", deviceHandler)

	return r
}

func main() {
	database.InitDB()

	userRepo := user.NewRepository(database.DB)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	inventoryRepo := inventory.NewRepository(database.DB)
	inventoryService := inventory.NewService(inventoryRepo)
	inventoryHandler := inventory.NewHandler(inventoryService)

	batchRepo := batch.NewRepository(database.DB)
	batchService := batch.NewService(batchRepo, inventoryService)
	batchHandler := batch.NewHandler(batchService)

	supplierRepo := supplier.NewRepository(database.DB)
	supplierService := supplier.NewService(supplierRepo)
	supplierHandler := supplier.NewHandler(supplierService)

	harvestRepo := harvest.NewRepository(database.DB)
	harvestService := harvest.NewService(harvestRepo)
	harvestHandler := harvest.NewHandler(harvestService)

	customerRepo := customer.NewRepository(database.DB)
	customerService := customer.NewService(customerRepo)
	customerHandler := customer.NewHandler(customerService)

	salesRepo := sales.NewRepository(database.DB)
	salesService := sales.NewService(salesRepo)
	salesHandler := sales.NewHandler(salesService)

	reportRepo := report.NewRepository(database.DB)
	reportService := report.NewService(reportRepo, batchRepo, salesRepo, inventoryRepo, harvestRepo)
	reportHandler := report.NewHandler(reportService)

	dashboardService := dashboard.NewService(batchRepo, salesRepo, inventoryRepo, harvestRepo)
	dashboardHandler := dashboard.NewHandler(dashboardService)

	planningRepo := planning.NewRepository(database.DB)
	planningService := planning.NewService(planningRepo)
	planningHandler := planning.NewHandler(planningService)

	cageStatusRepo := cagestatus.NewRepository(database.DB)
	cageStatusService := cagestatus.NewService(cageStatusRepo)
	cageStatusHandler := cagestatus.NewHandler(cageStatusService)

	gatewayServer := gateway.NewServer("")
	deviceHandler := gatewayServer.Handler

	router := buildRouter(
		userHandler,
		batchHandler,
		supplierHandler,
		inventoryHandler,
		harvestHandler,
		customerHandler,
		salesHandler,
		reportHandler,
		dashboardHandler,
		planningHandler,
		cageStatusHandler,
		deviceHandler,
	)

	server := &http.Server{
		Addr:         "0.0.0.0:8080",
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

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

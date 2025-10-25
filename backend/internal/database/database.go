package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)


var DB *sql.DB

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("Missing required env var: %s", key)
	}
	return v
}

func InitDB() {

	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dsn := mustGetEnv("DB_DSN")


	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	DB.SetMaxOpenConns(15)
	DB.SetMaxIdleConns(10)
	DB.SetConnMaxLifetime(45 * time.Minute)

	if err = DB.Ping(); err != nil {
		log.Fatal("Database ping failed:", err)
	}

	fmt.Println("Connected to MySQL successfully.")
}
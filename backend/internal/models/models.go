package models

import "database/sql"

/* ===========================
    Models
=========================== */

type User struct {
	Name     string `json:"usr_fullname"`
	Username string `json:"usr_username"`
	Role     string `json:"usr_role"`
	Status   string `json:"usr_status"`
}

type Items struct {
	ID         string `json:"ItemID"`
	SupplierID string `json:"SupplierID"`
	Name       string `json:"ItemName"`
	Category   string `json:"Category"`
	Unit       string `json:"Unit"`
}

type Batches struct {
	ID                  string  `json:"BatchNumber"`
	BatchName           string  `json:"BatchName"`
	TotalChicken        int     `json:"TotalChicken"`
	CurrentChicken      int     `json:"CurrentChicken"`
	StartDate           string  `json:"StartDate"`
	ExpectedHarvestDate string  `json:"ExpectedHarvestDate"`
	Status              string  `json:"Status"`
	Notes               string  `json:"Notes"`
	CostType            string  `json:"CostType"`
	Amount              float64 `json:"Amount"`
	Description         string  `json:"Description"`
	BirdsLost           int     `json:"BirdsLost"`
}

type Harvests struct {
	HarvestID     int     `json:"HarvestID"`
	BatchID       int     `json:"BatchNumber"`
	HarvestDate   string  `json:"HarvestDate"`
	Notes         string  `json:"Notes"`
	SaleType      string  `json:"SaleType"`
	BirdQuantity  int     `json:"BirdQuantity"`
	TotalWeightKg float64 `json:"TotalWeightKg"`
	PricePerKg    float64 `json:"PricePerKg"`
	SalesAmount   float64 `json:"SalesAmount"`
}

type Supplier struct {
	SupplierID    int     `json:"SupplierID"`
	SupplierName  string  `json:"SupplierName"`
	ContactPerson *string `json:"ContactPerson"`
	PhoneNumber   *string `json:"PhoneNumber"`
	Email         *string `json:"Email"`
	Address       *string `json:"Address"`
	Notes         *string `json:"Notes"`
}

type Sales struct {
	ID                int     `json:"sales_id"`
	Amount            float64 `json:"sales_amount"`
	Status            string  `json:"sales_status"`
	Date              string  `json:"sales_date"`
	Remarks           string  `json:"sales_remarks"`
	PurchaseNumber    string  `json:"purchase_number"`
	ProductPrice      float64 `json:"product_price"`
	ProductWeight     float64 `json:"product_weight"`
	ProductWeightUnit string  `json:"product_weight_unit"`
	ProductClass      string  `json:"product_class"`
	ProductBatch      string  `json:"product_batch"`
	ProductDays       int     `json:"product_days"`
}

type Product struct {
	ID                int     `json:"product_id"`
	ProductPrice      float64 `json:"product_price"`
	ProductWeight     float64 `json:"product_weight"`
	ProductWeightUnit string  `json:"product_weight_unit"`
}

type MoreProductInfo struct {
	ID                int     `json:"product_id"`
	ProductPrice      float64 `json:"product_price"`
	ProductWeight     float64 `json:"product_weight"`
	ProductWeightUnit string  `json:"product_weight_unit"`
	ProductClass      string  `json:"product_class"`
	ProductBatch      string  `json:"product_batch"`
	ProductDays       int     `json:"product_days"`
}

type SimpleSales struct {
	ID      int     `json:"sales_id"`
	Amount  float64 `json:"sales_amount"`
	Status  string  `json:"sales_status"`
	Date    string  `json:"sales_date"`
	Remarks string  `json:"sales_remarks"`
}

// for inventory items list
type InventoryItem struct {
	ItemID                 int     `json:"ItemID,omitempty"`
	ItemName               string  `json:"ItemName"`
	Category               string  `json:"Category"`
	Unit                   string  `json:"Unit"`
	TotalQuantityRemaining float64 `json:"TotalQuantityRemaining"`
}

// for inventory stock levels

type StockLevelSummary struct {
	ItemID                 int     `json:"ItemID"`
	ItemName               string  `json:"ItemName"`
	TotalQuantityRemaining float64 `json:"TotalQuantityRemaining"`
	Unit                   string  `json:"Unit"`
	IsActive               bool    `json:"IsActive"`
	Category               string  `json:"Category"`
}

// for harvested inventory items
type HarvestedInventoryItem struct {
	HarvestProductID  int     `json:"HarvestProductID"`
	HarvestDate       string  `json:"HarvestDate"`
	ProductType       string  `json:"ProductType"`
	BatchOrigin       string  `json:"BatchOrigin"`
	QuantityHarvested int     `json:"QuantityHarvested"`
	WeightHarvestedKg float64 `json:"WeightHarvestedKg"`
	QuantityRemaining int     `json:"QuantityRemaining"`
	WeightRemainingKg float64 `json:"WeightRemainingKg"`
}

type PurchaseHistoryDetail struct {
	ReceiptInfo       *string `json:"ReceiptInfo"`
	PurchaseID        int     `json:"PurchaseID"`
	PurchaseDate      string  `json:"PurchaseDate"`
	QuantityRemaining float64 `json:"QuantityRemaining"`
	QuantityPurchased float64 `json:"QuantityPurchased"`
	UnitCost          float64 `json:"UnitCost"`
	SupplierName      string  `json:"SupplierName"`
}

type PurchasePayload struct {
	ItemID            int     `json:"ItemID"`
	SupplierID        int     `json:"SupplierID"`
	PurchaseDate      string  `json:"PurchaseDate"`
	QuantityPurchased float64 `json:"QuantityPurchased"`
	UnitCost          float64 `json:"UnitCost"`
	ReceiptInfo        *string `json:"ReceiptInfo"`
}

type NewStockItemPayload struct {
	// New Item Details
	ItemName string `json:"ItemName"`
	Unit     string `json:"Unit"`
	Category string `json:"Category"`

	// Initial Purchase Details
	ReceiptInfo        *string `json:"ReceiptInfo"`
	PurchaseDate      string  `json:"PurchaseDate"`
	QuantityPurchased float64 `json:"QuantityPurchased"`
	AmountPaid        float64 `json:"AmountPaid"`

	// Supplier Details (one of these will be provided)
	ExistingSupplierID *int    `json:"ExistingSupplierID,omitempty"`
	NewSupplierName    *string `json:"NewSupplierName,omitempty"`
	ContactPerson      *string `json:"ContactPerson,omitempty"`
	PhoneNumber        *string `json:"PhoneNumber,omitempty"`
	Email              *string `json:"Email,omitempty"`
	Address            *string `json:"Address,omitempty"`
	Notes              *string `json:"Notes,omitempty"`
}

//for sales tab customer info

type Customer struct {
	CustomerID    int    `json:"CustomerID"`
	Name          string `json:"Name"`
	BusinessName  string `json:"BusinessName"`
	ContactNumber string `json:"ContactNumber"`
	Email         string `json:"Email"`
	Address       string `json:"Address"`
	DateAdded     string `json:"DateAdded"`
	IsActive      bool   `json:"IsActive"`
}

// for history log in sales tab

type SaleHistoryRecord struct {
	SaleID       int     `json:"SaleID"`
	SaleDate     string  `json:"SaleDate"`
	CustomerName string  `json:"CustomerName"`
	TotalAmount  float64 `json:"TotalAmount"`
}

// for details of a single sale record
type SaleDetailItem struct {
	SaleDetailID  int     `json:"SaleDetailID"`
	ItemName      string  `json:"ItemName"`
	QuantitySold  float64 `json:"QuantitySold"`
	TotalWeightKg float64 `json:"TotalWeightKg"`
	PricePerKg    float64 `json:"PricePerKg"`
}

// for creating new sales
type SaleProduct struct {
	HarvestProductID  int     `json:"HarvestProductID"`
	ProductType       string  `json:"ProductType"`
	QuantityRemaining float64 `json:"QuantityRemaining"`
	WeightRemainingKg float64 `json:"WeightRemainingKg"`
}

// for a single item within a new sale payload
type SaleDetailItemPayload struct {
	HarvestProductID int     `json:"HarvestProductID"`
	QuantitySold     float64 `json:"QuantitySold"`
	TotalWeightKg    float64 `json:"TotalWeightKg"`
	PricePerKg       float64 `json:"PricePerKg"`
}

// for entire payload for creating a new sale
type SalePayload struct {
	CustomerID    int                     `json:"CustomerID"`
	SaleDate      string                  `json:"SaleDate"`
	PaymentMethod string                  `json:"PaymentMethod"`
	Notes         string                  `json:"Notes"`
	Items         []SaleDetailItemPayload `json:"items"`
}

//for inventory usage log (Batch Monitoring)

type InventoryUsagePayload struct {
	BatchID      int     `json:"BatchID"`
	ItemID       int     `json:"ItemID"`
	QuantityUsed float64 `json:"QuantityUsed"`
	Date         string  `json:"Date"`
}

// for batch details table
type Batch struct {
	BatchID             int            `json:"batchID"`
	BatchName           string         `json:"batchName"`
	StartDate           string         `json:"startDate"`
	ExpectedHarvestDate string         `json:"expectedHarvestDate"`
	TotalChicken        int            `json:"totalChicken"`
	CurrentChicken      int            `json:"currentChicken"`
	Status              string         `json:"status"`
	Notes               sql.NullString `json:"notes"`
}

type BatchVitals struct {
	BatchName         string  `json:"batchName"`
	StartDate         string  `json:"startDate"`
	EndDate           *string `json:"endDate"`
	AgeInDays         int     `json:"ageInDays"`
	CurrentPopulation int     `json:"currentPopulation"`
	TotalMortality    int     `json:"totalMortality"`
}

// for adding new batch
type NewBatchPayload struct {
	BatchName           string  `json:"BatchName"`
	StartDate           string  `json:"StartDate"`
	ExpectedHarvestDate string  `json:"ExpectedHarvestDate"`
	TotalChicken        int     `json:"TotalChicken"`
	Notes               string  `json:"Notes"`
	ChickCost           float64 `json:"ChickCost"`
}

// for adding mortality event
type MortalityPayload struct {
	BatchID   int    `json:"BatchID"`
	Date      string `json:"Date"`
	BirdsLoss int    `json:"BirdsLoss"`
	Notes     string `json:"Notes"`
}

// for health check event (for future reference when farm is large enough to have veterinary)
type HealthCheckPayload struct {
	BatchID      int    `json:"BatchID"`
	CheckDate    string `json:"CheckDate"`
	Observations string `json:"Observations"`
	CheckedBy    string `json:"CheckedBy"`
}

// for direct cost entry
type DirectCostPayload struct {
	BatchID     int     `json:"BatchID"`
	Date        string  `json:"Date"`
	CostType    string  `json:"CostType"`
	Description string  `json:"Description"`
	Amount      float64 `json:"Amount"`
}

// For the list of harvested products in the Harvesting tab
type HarvestedProduct struct {
	HarvestProductID  int     `json:"HarvestProductID"`
	HarvestDate       string  `json:"HarvestDate"`
	ProductType       string  `json:"ProductType"`
	QuantityHarvested int     `json:"QuantityHarvested"`
	QuantityRemaining int     `json:"QuantityRemaining"`
	WeightHarvestedKg float64 `json:"WeightHarvestedKg"`
	WeightRemainingKg float64 `json:"WeightRemainingKg"`
}

// For the optional sale details within the harvest payload
type InstantSaleDetails struct {
	CustomerID    int     `json:"CustomerID"`
	PricePerKg    float64 `json:"PricePerKg"`
	PaymentMethod string  `json:"PaymentMethod"`
}

// For the main harvest payload from the frontend
type HarvestPayload struct {
	BatchID           int     `json:"BatchID"`
	HarvestDate       string  `json:"HarvestDate"`
	ProductType       string  `json:"ProductType"`
	QuantityHarvested int     `json:"QuantityHarvested"`
	TotalWeightKg     float64 `json:"TotalWeightKg"`
	// This is a pointer, which allows the field to be null if no sale is made
	SaleDetails *InstantSaleDetails `json:"SaleDetails"`
}

// for updating or editing a harvested product
type HarvestProductUpdatePayload struct {
	HarvestDate       string  `json:"HarvestDate"`
	ProductType       string  `json:"ProductType"`
	QuantityHarvested int     `json:"QuantityHarvested"`
	TotalWeightKg     float64 `json:"TotalWeightKg"`
}

// for logging byproducts from processing
type ByproductPayload struct {
	SourceHarvestProductID int     `json:"SourceHarvestProductID"`
	QuantityToProcess      int     `json:"QuantityToProcess"`
	ByproductType          string  `json:"ByproductType"`
	ByproductWeightKg      float64 `json:"ByproductWeightKg"`
	BatchID                int     `json:"BatchID"`
	HarvestDate            string  `json:"HarvestDate"`
}

type YieldedByproduct struct {
	ByproductType     string  `json:"ByproductType"`
	ByproductWeightKg float64 `json:"ByproductWeightKg"`
}

type ProcessPayload struct {
	SourceHarvestProductID int                `json:"SourceHarvestProductID"`
	QuantityToProcess      int                `json:"QuantityToProcess"`
	BatchID                int                `json:"BatchID"`
	ProcessingDate         string             `json:"ProcessingDate"`
	Yields                 []YieldedByproduct `json:"Yields"`
}

type UpdateBatchPayload struct {
	BatchName           string `json:"BatchName"`
	ExpectedHarvestDate string `json:"ExpectedHarvestDate"`
	Notes               string `json:"Notes"`
	Status              string `json:"Status"`
}

// for reporting tab - executive summary, financial breakdown, operational analytics
type ExecutiveSummary struct {
	NetProfit           float64 `json:"netProfit"`
	ROI                 float64 `json:"roi"`
	FeedConversionRatio float64 `json:"feedConversionRatio"`
	HarvestRecovery     float64 `json:"harvestRecovery"`
	CostPerKg           float64 `json:"costPerKg"`
}

type FinancialBreakdownItem struct {
	Category   string  `json:"category"`
	Amount     float64 `json:"amount"`
	Percentage float64 `json:"percentage"`
	PerBird    float64 `json:"perBird"`
}

type OperationalAnalytics struct {
	InitialBirdCount     int     `json:"initialBirdCount"`
	FinalBirdCount       int     `json:"finalBirdCount"`
	MortalityRate        float64 `json:"mortalityRate"`
	AverageHarvestAge    int     `json:"averageHarvestAge"`
	TotalFeedConsumed    float64 `json:"totalFeedConsumed"`
	TotalWeightHarvested float64 `json:"totalWeightHarvested"`
	AverageHarvestWeight float64 `json:"averageHarvestWeight"`
}

type BatchReportData struct {
	BatchName            string                   `json:"batchName"`
	DurationDays         int                      `json:"durationDays"`
	ExecutiveSummary     ExecutiveSummary         `json:"executiveSummary"`
	FinancialBreakdown   []FinancialBreakdownItem `json:"financialBreakdown"`
	OperationalAnalytics OperationalAnalytics     `json:"operationalAnalytics"`
}

// for transaction history in reports tab
type Transaction struct {
	Date        string  `json:"date"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
}

// for dashboard data ---------------------------------
// For the main dashboard data structure
type DashboardData struct {
	AtAGlance          AtAGlanceData           `json:"atAGlance"`
	ActiveBatches      []ActiveBatch           `json:"activeBatches"`
	StockItems         []StockStatus           `json:"stockItems"`
	Charts             ChartsData              `json:"charts"`
	Alerts             []Alert                 `json:"alerts"`
	FinancialForecasts []FinancialForecastData `json:"financialForecasts"`
}

// For the top "At a Glance" cards
type AtAGlanceData struct {
	ActiveBatchCount  int     `json:"activeBatchCount"`
	CurrentPopulation int     `json:"currentPopulation"`
	MonthlyRevenue    float64 `json:"monthlyRevenue"`
	SellableInventory int     `json:"sellableInventory"`
	TotalBirds        int     `json:"totalBirds"`
}

// For the "Active Batches" list
type ActiveBatch struct {
	ID         string `json:"id"`
	Age        int    `json:"age"`
	Population int    `json:"population"`
	Mortality  int    `json:"mortality"`
}

// For the "Stock Status" panel
type StockStatus struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Level    int    `json:"level"`
	Status   string `json:"status"`
	Quantity string `json:"quantity"`
	
	Unit     string `json:"-"` 
	Category string `json:"-"`
	RawQty   float64 `json:"-"`
}
// For the new charts
type ChartsData struct {
	RevenueTimeline []RevenueDataPoint   `json:"revenueTimeline"`
	CostBreakdown   []CostBreakdownPoint `json:"costBreakdown"`
}

type RevenueDataPoint struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

type CostBreakdownPoint struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

// For the "Smart Alerts" panel
type Alert struct {
	Type    string `json:"type"` // "warning", "critical", "info"
	Message string `json:"message"`
}

type FinancialForecastData struct {
	BatchID          string  `json:"batchId"`
	BatchName        string  `json:"batchName"`
	AccruedCost      float64 `json:"accruedCost"`
	EstimatedRevenue float64 `json:"estimatedRevenue"`
	Progress         int     `json:"progress"`
	StartDate        string  `json:"startDate"`
	EndDate          string  `json:"endDate"`
}

type ActiveBatchInternal struct {
	BatchID             int
	Name                string
	StartDate           string
	ExpectedHarvestDate string
	Population          int
	InitialPopulation   int    
	TotalMortality      int    
}
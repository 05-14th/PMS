package cagestatus

// ActiveBatch matches the shape expected by CageStatusReport.tsx
type ActiveBatch struct {
	BatchID   int64  `json:"batchID"`
	BatchName string `json:"batchName"`
	CageNum   string `json:"cageNum"`
}

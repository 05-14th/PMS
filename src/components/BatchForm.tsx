// BatchForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

type Supplier = {
  SupplierID: number;
  SupplierName: string;
};

type CreateSupplierReq = {
  SupplierName: string;
  ContactPerson?: string;
  PhoneNumber?: string;
  Email?: string;
  Address?: string;
  Notes?: string;
};

type CreateBatchReq = {
  TotalChicken: number;
  StartDate: string; // YYYY-MM-DD
  ExpectedHarvestDate?: string; // YYYY-MM-DD, optional
  SupplierID: number;
  Notes?: string;
};

type CreateCostReq = {
  BatchID: number;
  CostType: string; // example: "Initial"
  Amount: number;
  Description?: string;
};

const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const BatchForm: React.FC = () => {
  // Form state
  const [totalChicken, setTotalChicken] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [supplierID, setSupplierID] = useState<string>(""); // "new" for new supplier
  const [notes, setNotes] = useState<string>("");

  // Supplier list
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // New supplier inline fields
  const [newSupplierName, setNewSupplierName] = useState<string>("");

  // Auto compute expected date on start date change if user has not manually edited it
  const userOverrodeExpected = useMemo(() => expectedDate && startDate && expectedDate !== addDays(startDate, 28), [expectedDate, startDate]);
  const serverHost = import.meta.env.VITE_APP_SERVERHOST;

  useEffect(() => {
    if (startDate && !userOverrodeExpected) {
      setExpectedDate(addDays(startDate, 28));
    }
  }, [startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        setError("");
        // Adjust endpoint if different in your API
        const res = await axios.get(`${serverHost}/getSupplier`)
            .then((res) => setSuppliers(res.data))
            .catch((err) => console.error(err));
      } catch (e: any) {
        setError("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 1) Ensure we have a SupplierID
      let supplierIdToUse: number;
      if (supplierID === "new") {
        if (!newSupplierName.trim()) {
          setError("Please enter a supplier name.");
          return;
        }
        const createSupplierPayload: CreateSupplierReq = { SupplierName: newSupplierName.trim() };
        const s = await axios.post<{ SupplierID: number }>("/createSupplier", createSupplierPayload);
        supplierIdToUse = s.data.SupplierID;
      } else {
        if (!supplierID) {
          setError("Please select a supplier.");
          return;
        }
        supplierIdToUse = Number(supplierID);
      }

      // 2) Create batch
      const batchPayload: CreateBatchReq = {
        TotalChicken: Number(totalChicken),
        StartDate: startDate,
        ExpectedHarvestDate: expectedDate || undefined,
        SupplierID: supplierIdToUse,
        Notes: notes || undefined,
      };

      const b = await axios.post<{ BatchID: number }>("/createBatch", batchPayload);
      const batchID = b.data.BatchID;

      // 3) Create production cost record tied to the batch
      const costPayload: CreateCostReq = {
        BatchID: batchID,
        CostType: "Initial",
        Amount: Number(amount),
        Description: "Initial cost",
      };
      await axios.post("/createProductionCost", costPayload);

      // Reset form
      setTotalChicken(0);
      setStartDate("");
      setExpectedDate("");
      setAmount(0);
      setSupplierID("");
      setNewSupplierName("");
      setNotes("");

      alert("Batch saved successfully.");
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || "Failed to save batch.";
      setError(String(msg));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white shadow rounded p-6 space-y-6">
      <h2 className="text-xl font-semibold">Create Batch</h2>

      {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {/* Total Chicken */}
      <div>
        <label className="block text-sm font-medium mb-1">Total Chicken</label>
        <input
          type="number"
          min={0}
          value={totalChicken}
          onChange={(e) => setTotalChicken(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="e.g. 1000"
          required
        />
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Date chicks arrived.</p>
      </div>

      {/* Expected Harvest Date */}
      <div>
        <label className="block text-sm font-medium mb-1">Expected Harvest Date</label>
        <input
          type="date"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
        />
        <p className="text-xs text-gray-500 mt-1">Auto set to Start Date + 28 days. You can override if needed.</p>
      </div>

      {/* Amount for cm_production_cost */}
      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="e.g. 2500.00"
          required
        />
        <p className="text-xs text-gray-500 mt-1">This is saved to cm_production_cost as CostType: Initial.</p>
      </div>

      {/* Supplier dropdown */}
      <div>
        <label className="block text-sm font-medium mb-1">Supplier</label>
        <div className="flex gap-3">
          <select
            value={supplierID}
            onChange={(e) => setSupplierID(e.target.value)}
            className="flex-1 border rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-200"
            disabled={loadingSuppliers}
            required={newSupplierName.trim().length === 0}
          >
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.SupplierID} value={s.SupplierID}>
                {s.SupplierName}
              </option>
            ))}
            <option value="new">Add new supplier</option>
          </select>

          {supplierID === "new" && (
            <input
              type="text"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              placeholder="New supplier name"
              className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
          )}
        </div>
        {loadingSuppliers && <p className="text-xs text-gray-500 mt-1">Loading suppliers...</p>}
      </div>

      {/* Notes optional */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded px-3 py-2 h-24 resize-y focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Optional notes"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
        >
          Save Batch
        </button>
      </div>
    </form>
  );
};

export default BatchForm;

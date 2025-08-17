// InventoryForm.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

type Supplier = {
  SupplierID: number;
  SupplierName: string;
};

enum CategoryEnum {
  Feed = "Feed",
  Medicine = "Medicine",
  Equipment = "Equipment",
  Packaging = "Packaging",
  Utilities = "Utilities",
  Other = "Other",
}

type CreateItemReq = {
  ItemName: string;
  Category: CategoryEnum;
  Unit: string;
  UnitCost: number;
  SupplierID: number;
};

const InventoryForm: React.FC = () => {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<CategoryEnum>(CategoryEnum.Feed);
  const [unit, setUnit] = useState("");
  const [unitCost, setUnitCost] = useState<number | "">("");
  const [supplierID, setSupplierID] = useState<string>("");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [error, setError] = useState("");
  const serverHost = import.meta.env.VITE_APP_SERVERHOST;
  const [newSupplierName, setNewSupplierName] = useState<string>("");

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        setError("");
        // Adjust to your actual endpoint
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

    if (!itemName.trim()) return setError("Item Name is required.");
    if (!unit.trim()) return setError("Unit is required.");
    if (unitCost === "" || Number(unitCost) < 0) return setError("Unit Cost must be zero or higher.");
    if (!supplierID) return setError("Supplier is required.");

    try {
      const payload: CreateItemReq = {
        ItemName: itemName.trim(),
        Category: category,
        Unit: unit.trim(),
        UnitCost: Number(unitCost),
        SupplierID: Number(supplierID),
      };

      // Adjust to your actual endpoint
      await axios.post("/createInventoryItem", payload);

      // Reset
      setItemName("");
      setCategory(CategoryEnum.Feed);
      setUnit("");
      setUnitCost("");
      setSupplierID("");

      alert("Item added to inventory.");
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || "Failed to add item.";
      setError(String(msg));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white shadow rounded p-6 space-y-6">
      <h2 className="text-xl font-semibold">Add Inventory Item</h2>

      {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {/* Item Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Item Name</label>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Example: Grower Feed"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryEnum)}
          className="w-full border rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-200"
        >
          {Object.values(CategoryEnum).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Unit */}
      <div>
        <label className="block text-sm font-medium mb-1">Unit</label>
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="kg, bag, box"
          required
        />
      </div>

      {/* Unit Cost */}
      <div>
        <label className="block text-sm font-medium mb-1">Unit Cost</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="0.00"
          required
        />
      </div>

      {/* Supplier */}
      <div>
        <label className="block text-sm font-medium mb-1">Supplier</label>
        <div className="flex gap-3">
            <select
          value={supplierID}
          onChange={(e) => setSupplierID(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-200"
          disabled={loadingSuppliers}
          required
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

      <div className="pt-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
        >
          Save Item
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;

// SupplierForm.tsx
import React, { useState } from "react";
import axios from "axios";

type CreateSupplierReq = {
  SupplierName: string;       // business name
  ContactPerson?: string;
  PhoneNumber?: string;
  Email?: string;
  Address?: string;
  Notes?: string;             // optional
};

const SupplierForm: React.FC = () => {
  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!supplierName.trim()) {
      setError("Supplier Name is required.");
      return;
    }
    // basic optional validations
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (contactNumber && !/^[\d()+\-\s]{6,}$/.test(contactNumber)) {
      setError("Enter a valid contact number.");
      return;
    }

    const payload: CreateSupplierReq = {
      SupplierName: supplierName.trim(),
      ContactPerson: contactPerson.trim() || undefined,
      PhoneNumber: contactNumber.trim() || undefined,
      Email: email.trim() || undefined,
      Address: address.trim() || undefined,
      Notes: notes.trim() || undefined,
    };

    try {
      setLoading(true);
      // Adjust to your API route
      await axios.post("/createSupplier", payload);

      setSuccess("Supplier saved.");
      // reset
      setSupplierName("");
      setContactPerson("");
      setContactNumber("");
      setEmail("");
      setAddress("");
      setNotes("");
    } catch (err: any) {
      const msg = err?.response?.data || err?.message || "Failed to save supplier.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white shadow rounded p-6 space-y-6">
      <h2 className="text-xl font-semibold">Add Supplier</h2>

      {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      {/* Supplier Name (Business Name) */}
      <div>
        <label className="block text-sm font-medium mb-1">Supplier Name (Business Name)</label>
        <input
          type="text"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="e.g. Sunrise Feeds Trading"
          required
        />
      </div>

      {/* Contact Person */}
      <div>
        <label className="block text-sm font-medium mb-1">Contact Person</label>
        <input
          type="text"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="e.g. Juan Dela Cruz"
        />
      </div>

      {/* Contact Number */}
      <div>
        <label className="block text-sm font-medium mb-1">Contact Number</label>
        <input
          type="tel"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="e.g. +63 912 345 6789"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="name@business.com"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Street, City, Province, Postal"
        />
      </div>

      {/* Notes (Optional) */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded px-3 py-2 h-24 resize-y focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Any extra info"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Supplier"}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;

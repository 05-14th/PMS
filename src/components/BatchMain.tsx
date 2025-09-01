
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BatchDetails from "./BatchDetails";
import axios from "axios";

type Batch = {
  BatchNumber: string;
  BatchName: string;
  StartDate: string;
  CurrentChicken: number;
  Status: "Active" | "Sold" | "Archived";
};

type BatchRow = {
  id: string;
  name: string;
  startDate: string;
  population: number;
  status: "Active" | "Sold" | "Archived";
};

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST, // replace with your real API
  timeout: 10000,
});

export default function BatchesList() {
  const navigate = useNavigate();
  const { id: batchId } = useParams();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api
      .get<Batch[]>("/getBatches")
      .then(res => {
        if (!isMounted) return;
        // Map backend fields to frontend fields
        const mapped = res.data.map((b: Batch) => ({
          id: b.BatchNumber,
          name: b.BatchName,
          startDate: b.StartDate,
          population: b.CurrentChicken,
          status: b.Status,
        }));
        setBatches(mapped);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err?.message || "Failed to load batches");
      })
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">All Batches</h2>
          <button className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm hover:opacity-90">
            Add New Batch
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Name or Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Population
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Loading batches...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && batches.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No batches found
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                batches.map(b => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 text-gray-900">{b.name}</td>
                    <td className="px-4 py-3 text-gray-700">{b.startDate}</td>
                    <td className="px-4 py-3 text-gray-700">{b.population}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          b.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : b.status === "Sold"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-sm font-medium text-gray-900 hover:opacity-80"
                        onClick={() => navigate(`/batches/${b.id}`)}
                      >
                        Details
                      </button>
                      <button
                        className="text-sm font-medium text-gray-900 hover:opacity-80"
                        onClick={() => {}}
                      >
                        Edit
                      </button>
                      <button
                        className="text-sm font-medium text-gray-900 hover:opacity-80"
                        onClick={() => {}}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal for BatchDetails */}
      {batchId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "1rem",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 2px 24px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <button
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                fontSize: 20,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#333",
                zIndex: 10,
              }}
              onClick={() => navigate("/batches")}
              aria-label="Close"
            >
              ×
            </button>
            <BatchDetails batchId={batchId} />
          </div>
        </div>
      )}
    </div>
  );
}

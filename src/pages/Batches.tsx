import React, { useState } from "react";
import MainBody from "../components/MainBody";
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronRight } from "react-icons/fa";

type Batch = {
  id: string;
  name: string;
  startDate: string;
  population: number;
};

type MortalityEntry = {
  batchId: string;
  count: number;
};

const BatchCard: React.FC = () => {
  const [batches] = React.useState<Batch[]>([
    { id: "B001", name: "Batch 1", startDate: "2025-08-01", population: 100 },
    { id: "B002", name: "Batch 2", startDate: "2025-08-15", population: 150 },
  ]);

  const [batchId, setBatchId] = React.useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [mortalityEntries] = React.useState<MortalityEntry[]>([
    { batchId: "B001", count: 5 },
    { batchId: "B002", count: 3 },
  ]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const todayAge = selectedBatch
    ? Math.floor(
        (new Date().getTime() - new Date(selectedBatch.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : "";

  const totalMortality = mortalityEntries
    .filter((m) => m.batchId === batchId)
    .reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-medium text-gray-900">Batch Management</h2>
          {selectedBatch && (
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md">
              Start Date: {new Date(selectedBatch.startDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          )}
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1.5">
              Batch
            </label>
            <div className="relative">
              <select
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setSelectedBatchId(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">Select a batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <FaChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1.5">
              Population
            </label>
            <input
              readOnly
              value={selectedBatch?.population ?? ""}
              className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1.5">
              Age
            </label>
            <input
              readOnly
              value={todayAge ? `${todayAge} days` : ""}
              className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1.5">
              Mortality
            </label>
            <input
              readOnly
              value={batchId ? totalMortality : 0}
              className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-md bg-gray-50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center border-t border-gray-100 pt-6 mt-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
          >
            {showDetails ? (
              <FaChevronDown className="w-3.5 h-3.5" />
            ) : (
              <FaChevronRight className="w-3.5 h-3.5" />
            )}
            <span>View Details</span>
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span>Add Batch</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-600 bg-white border border-green-200 rounded-md hover:bg-green-50 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <FaEdit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            >
              <FaTrash className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details Panel - Outside the main card */}
      {showDetails && selectedBatch && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 transition-all duration-300">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DetailItem label="Batch ID" value={selectedBatch.id} />
            <DetailItem 
              label="Current Population" 
              value={`${selectedBatch.population - totalMortality} birds`} 
            />
            <DetailItem 
              label="Mortality Rate" 
              value={`${((totalMortality / selectedBatch.population) * 100).toFixed(2)}%`} 
            />
            <DetailItem 
              label="Status" 
              value="Active" 
              valueClassName="text-green-600" 
            />
          </div>
          
          {/* Additional content can be added here */}
          <div className="mt-6">
            {/* Future content will go here */}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable DetailItem component
const DetailItem: React.FC<{
  label: string;
  value: string | number;
  valueClassName?: string;
}> = ({ label, value, valueClassName = "text-gray-900" }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-sm font-medium ${valueClassName}`}>
      {value}
    </p>
  </div>
);

function Batches() {
  return (
    <MainBody>
      <BatchCard />
    </MainBody>
  );
}

export default Batches;

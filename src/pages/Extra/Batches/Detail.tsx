import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import Monitoring from "./Monitoring";
import Harvesting from "./Harvesting";

// CORRECTED: Interface now uses camelCase
interface Batch {
  batchID: number;
  batchName: string;
  startDate: string;
  expectedHarvestDate: string;
  totalChicken: number;
  currentChicken: number;
  status: string;
  notes?: { String: string; Valid: boolean };
}

interface DetailProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
}

type TabType = "monitoring" | "harvesting";

const Detail: React.FC<DetailProps> = ({ isOpen, onClose, batch }) => {
  const [activeTab, setActiveTab] = useState<TabType>("monitoring");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) =>
        e.key === "Escape" && onClose();
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
    document.body.style.overflow = "unset";
  }, [isOpen, onClose]);

  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <FaArrowLeft className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Back to all batches</span>
            </button>
            <div className="ml-4">
              {/* CORRECTED: Use camelCase properties */}
              <h3 className="text-lg font-medium text-gray-900">
                Batch: {batch.batchName}
              </h3>
              <p className="text-sm text-gray-500">ID: {batch.batchID}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("monitoring")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "monitoring" ? "border-green-500 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                Monitoring
              </button>
              <button
                onClick={() => setActiveTab("harvesting")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "harvesting" ? "border-green-500 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                Harvesting
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === "monitoring" && <Monitoring batch={batch} />}
          {activeTab === "harvesting" && <Harvesting batch={batch} />}
        </div>
      </div>
    </div>
  );
};

export default Detail;

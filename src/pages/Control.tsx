import React, { useState, useRef } from "react";
import Feedingandwatering from "./Extra/Control/Feedingandwatering";
import Environmental from "./Extra/Control/Environmental";

const SubTabsPage: React.FC<{ onShowGuide: () => void }> = ({ onShowGuide }) => {
  const [activeTab, setActiveTab] = useState("feeding");
  const [batchNo, setBatchNo] = useState("Batch 001"); // ✅ Default selection
  const tabContainerRef = useRef<HTMLDivElement>(null);

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBatchNo(e.target.value);
    console.log("Selected Batch:", e.target.value);
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-2xl mt-16 relative"
      ref={tabContainerRef}
    >
      {/* ✅ Batch No Combo Box */}
      <div className="mb-6">
        <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-2">
          Batch No
        </label>
        <select
          id="batch"
          value={batchNo}
          onChange={handleBatchChange}
          className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option>Batch 001</option>
          <option>Batch 002</option>
          <option>Batch 003</option>
          <option>Batch 004</option>
        </select>
      </div>

      {/* ✅ Sub Tabs */}
      <div className="flex mb-4 border-b">
        <button
          className={`flex-1 py-2 px-4 text-center font-medium ${
            activeTab === "feeding"
              ? "border-b-4 border-green-500 text-green-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("feeding")}
        >
          Feeding and Watering
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center font-medium ${
            activeTab === "environmental"
              ? "border-b-4 border-green-500 text-green-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("environmental")}
        >
          Environmental
        </button>
      </div>

      {/* ✅ Tab Content */}
      <div className="p-4">
        {activeTab === "feeding" && <Feedingandwatering />}
        {activeTab === "environmental" && <Environmental />}
      </div>
    </div>
  );
};

export default SubTabsPage;

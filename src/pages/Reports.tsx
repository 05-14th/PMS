import React, { useState, useEffect } from "react";
import { FileText, Package, List, Download } from "lucide-react";
import MainBody from "../components/MainBody";
import TransactionHistory from "./Extra/Report_subtabs/TransactionHistory";
import BatchReport from "./Extra/Report_subtabs/Batchreport";

type TabType = "batch" | "transaction";

// Define the shape of a single batch object
interface Batch {
  BatchID: number;
  BatchName: string;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("batch");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");

  // Fetch the list of batches when the component mounts
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/batch-list");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: Batch[] = await response.json();
        setBatches(data || []);
      } catch (error) {
        console.error("Failed to fetch batches:", error);
      }
    };
    fetchBatches();
  }, []);

  const handleExport = () => {
    console.log(`Exporting report for batch ID: ${selectedBatchId}`);
    // Add your PDF export logic here
  };

  const tabs = [
    {
      id: "batch",
      label: "Batch Report",
      icon: <Package size={18} className="mr-1" />,
    },
    {
      id: "transaction",
      label: "Transaction History",
      icon: <List size={18} className="mr-1" />,
    },
  ];

  return (
    <MainBody>
      <div className="p-6">
        {/* --- MODIFIED HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 mr-2 text-green-700" />
            <h1 className="text-2xl font-bold text-gray-800 mr-4">Reports:</h1>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full md:w-64 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <option value="all">Select a Batch</option>
              {batches.map((batch) => (
                <option key={batch.BatchID} value={batch.BatchID}>
                  {batch.BatchName}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={!selectedBatchId || selectedBatchId === "all"}
            className="w-full md:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>

        {/* Tabs - Unchanged */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium leading-5 transition-all duration-200 flex items-center justify-center ${
                activeTab === tab.id
                  ? "bg-white shadow-md text-green-600"
                  : "text-gray-600 hover:bg-white/[0.12] hover:text-green-700"
              }`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content - Now passing selectedBatchId as a prop */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          {activeTab === "batch" && (
            <BatchReport selectedBatchId={selectedBatchId} />
          )}
          {activeTab === "transaction" && (
            <TransactionHistory selectedBatchId={selectedBatchId} />
          )}
        </div>
      </div>
    </MainBody>
  );
};

export default Reports;

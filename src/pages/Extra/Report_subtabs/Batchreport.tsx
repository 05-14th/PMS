import React, { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

interface TableRow {
  id: string | number;
  category: string;
  amount: string | number;
  percentage: string | number;
  perBird: string | number;
  isTotal?: boolean;
}

const BatchReport: React.FC = () => {
  // Sample data for metric cards
  const metrics = [
    { title: "Net Profit", value: "₱25,450", change: "+12.5%", isPositive: true },
    { title: "Return on Investment", value: "18.7%", change: "+2.3%", isPositive: true },
    { title: "Feed Conversion Ratio", value: "1.75", change: "-0.15", isPositive: false },
    { title: "Harvest Recovery", value: "87.3%", change: "+1.2%", isPositive: true },
    { title: "Cost per Kg", value: "₱89.50", change: "-₱2.30", isPositive: true },
  ];

  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([]);

  const batches = ["All Batches", "Batch #001", "Batch #002", "Batch #003"];

  const handleExport = () => {
    // Add export functionality here
    console.log("Exporting report...");
  };

  return (
    <div className="space-y-6">
      {/* Header with Dropdown and Export Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {selectedBatch}
            <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
          </button>
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none">
              {batches.map((batch) => (
                <button
                  key={batch}
                  onClick={() => {
                    setSelectedBatch(batch);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {batch}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleExport}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-4 border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{metric.value}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  metric.isPositive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Breakdown Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Cost Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Percentage of Total Cost
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount per Bird
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.length > 0 ? (
                tableData.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.isTotal ? "bg-gray-50 font-semibold" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {row.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {row.percentage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {row.perBird}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchReport;

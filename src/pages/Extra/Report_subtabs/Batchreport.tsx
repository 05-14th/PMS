import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// --- TYPE DEFINITIONS TO MATCH YOUR GO BACKEND ---
interface ExecutiveSummary {
  netProfit: number;
  roi: number;
  feedConversionRatio: number;
  harvestRecovery: number; // ADDED THIS LINE
  costPerKg: number;
}

interface FinancialBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  perBird: number;
}

interface OperationalAnalytics {
  initialBirdCount: number;
  finalBirdCount: number;
  mortalityRate: number;
  totalFeedConsumed: number;
  totalWeightHarvested: number;
  averageHarvestWeight: number;
}

interface BatchReportData {
  executiveSummary: ExecutiveSummary;
  financialBreakdown: FinancialBreakdownItem[];
  operationalAnalytics: OperationalAnalytics;
}

// --- PROPS INTERFACE ---
interface BatchReportProps {
  selectedBatchId: string | null;
}

// --- HELPER FUNCTIONS FOR FORMATTING ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

const formatNumber = (value: number, decimals = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

// --- METRIC CARD COMPONENT ---
const MetricCard: React.FC<{ title: string; value: string }> = ({
  title,
  value,
}) => (
  <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

// --- MAIN COMPONENT ---
const BatchReport: React.FC<BatchReportProps> = ({ selectedBatchId }) => {
  const [reportData, setReportData] = useState<BatchReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBatchId || selectedBatchId === "all") {
      setReportData(null);
      return;
    }

    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:8080/api/reports/batch/${selectedBatchId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch report data");
        }
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError("Could not load report data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [selectedBatchId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!reportData) {
    return (
      <div className="text-center text-gray-500 h-64 flex items-center justify-center">
        <p>Please select a batch to view its report.</p>
      </div>
    );
  }

  const { executiveSummary, financialBreakdown, operationalAnalytics } =
    reportData;

  return (
    <div className="space-y-8">
      {/* --- EXECUTIVE SUMMARY --- */}
      <div>
        <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4">
          Executive Summary
        </h3>
        {/* UPDATED a 4 to a 5 for the grid columns to make it look nice */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Net Profit"
            value={formatCurrency(executiveSummary.netProfit)}
          />
          <MetricCard
            title="Return on Investment"
            value={`${formatNumber(executiveSummary.roi)}%`}
          />
          <MetricCard
            title="Feed Conversion Ratio"
            value={formatNumber(executiveSummary.feedConversionRatio)}
          />
          {/* ADDED this new Metric Card */}
          <MetricCard
            title="Harvest Recovery"
            value={`${formatNumber(executiveSummary.harvestRecovery)}%`}
          />
          <MetricCard
            title="Cost per Kg"
            value={formatCurrency(executiveSummary.costPerKg)}
          />
        </div>
      </div>

      {/* --- FINANCIAL BREAKDOWN --- */}
      <div>
        <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4">
          Financial Breakdown
        </h3>
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
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
                  % of Total Cost
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cost per Bird
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financialBreakdown.map((row, index) => (
                <tr
                  key={index}
                  className={
                    row.category.startsWith("-")
                      ? ""
                      : "bg-gray-50 font-semibold"
                  }
                >
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${row.category.startsWith("-") ? "pl-10 text-gray-700" : "text-gray-900"}`}
                  >
                    {row.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {row.percentage > 0
                      ? `${formatNumber(row.percentage)}%`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatCurrency(row.perBird)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- OPERATIONAL ANALYTICS --- */}
      <div>
        <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4">
          Operational Analytics
        </h3>
        <div className="bg-white shadow border p-6 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">
              Initial Bird Count:
            </span>{" "}
            <span className="text-gray-900">
              {operationalAnalytics.initialBirdCount}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">
              Total Feed Consumed:
            </span>{" "}
            <span className="text-gray-900">
              {formatNumber(operationalAnalytics.totalFeedConsumed)} kg
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Final Bird Count:</span>{" "}
            <span className="text-gray-900">
              {operationalAnalytics.finalBirdCount}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">
              Total Weight Harvested:
            </span>{" "}
            <span className="text-gray-900">
              {formatNumber(operationalAnalytics.totalWeightHarvested)} kg
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Mortality Rate:</span>{" "}
            <span className="text-gray-900">
              {formatNumber(operationalAnalytics.mortalityRate)}%
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">
              Average Harvest Weight:
            </span>{" "}
            <span className="text-gray-900">
              {formatNumber(operationalAnalytics.averageHarvestWeight)} kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchReport;

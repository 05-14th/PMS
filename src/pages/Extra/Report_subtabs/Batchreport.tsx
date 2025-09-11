import React, { useState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- TYPE DEFINITIONS ---
interface ExecutiveSummary {
  netProfit: number;
  roi: number;
  feedConversionRatio: number;
  harvestRecovery: number;
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
  batchName?: string;
  durationDays?: number;
}

interface BatchReportProps {
  selectedBatchId: string | null;
}

// --- FORMAT HELPERS ---
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

  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString("en-PH");

    // Header
    doc.setFontSize(12);
    doc.text("Chickmate Poultry Farm", 14, 15);
    doc.text("Address: Paracale, Bicol, PH", 14, 22);
    doc.text(`Date Generated: ${today}`, 150, 15);

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Performance and Financial Report", 14, 35);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Batch Name: ${reportData.batchName || selectedBatchId}`, 14, 42);
    doc.text(`Duration: ${reportData.durationDays || "N/A"} days`, 14, 49);

    // Executive Summary
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 14, 60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const es = reportData.executiveSummary;
    const execSummaryData = [
      ["Net Profit", formatCurrency(es.netProfit)],
      ["Feed Conversion Ratio", formatNumber(es.feedConversionRatio)],
      ["Liveability %", `${formatNumber(es.harvestRecovery)}%`],
      ["Cost per Kg", formatCurrency(es.costPerKg)],
    ];
    autoTable(doc, {
      startY: 65,
      head: [["Metric", "Value"]],
      body: execSummaryData,
      theme: "grid",
    });

    // Financial Breakdown
    const fbStartY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Breakdown", 14, fbStartY);

    const fbRows = reportData.financialBreakdown.map((row) => [
      row.category,
      formatCurrency(row.amount),
      row.percentage > 0 ? `${formatNumber(row.percentage)}%` : "-",
      formatCurrency(row.perBird),
    ]);
    autoTable(doc, {
      startY: fbStartY + 5,
      head: [["Category", "Total Amount (Php)", "% of Total Cost", "Per Bird"]],
      body: fbRows,
      theme: "grid",
    });

    // Operational Analytics
    const oaStartY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Operational Analytics", 14, oaStartY);

    const oa = reportData.operationalAnalytics;
    const oaData = [
      ["Initial Bird Count", oa.initialBirdCount],
      ["Final Bird Count", oa.finalBirdCount],
      ["Mortality Rate", `${formatNumber(oa.mortalityRate)}%`],
      ["Average Harvest Age", `${reportData.durationDays || "N/A"} days`],
      ["Total Feed Consumed", `${formatNumber(oa.totalFeedConsumed)} kg`],
      ["Total Weight Harvested", `${formatNumber(oa.totalWeightHarvested)} kg`],
      ["Average Harvest Weight", `${formatNumber(oa.averageHarvestWeight)} kg`],
      ["Avg. Selling Price", formatCurrency(es.costPerKg)], // adjust if you have actual selling price
    ];

    autoTable(doc, {
      startY: oaStartY + 5,
      head: [["Metric", "Value"]],
      body: oaData,
      theme: "grid",
    });

    // Save PDF
    doc.save(`BatchReport_${reportData.batchName || selectedBatchId}.pdf`);
  };

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
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
        >
          <Download className="h-5 w-5" />
          Export PDF
        </button>
      </div>

      {/* --- EXECUTIVE SUMMARY --- */}
      <div>
        <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4">
          Executive Summary
        </h3>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  % of Total Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
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
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      row.category.startsWith("-")
                        ? "pl-10 text-gray-700"
                        : "text-gray-900"
                    }`}
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
            </span>
            <span className="text-gray-900">
              {operationalAnalytics.initialBirdCount}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">
              Total Feed Consumed:
            </span>
            <span className="text-gray-900">
              {formatNumber(operationalAnalytics.totalFeedConsumed)} kg
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Final Bird Count:</span>
            <span className="text-gray-900">
              {operationalAnalytics.finalBirdCount}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">
              Total Weight Harvested:
            </span>
            <span className="text-gray-900">
              {formatNumber(operationalAnalytics.totalWeightHarvested)} kg
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Mortality Rate:</span>
            <span className="text-gray-900">
              {formatNumber(operationalAnalytics.mortalityRate)}%
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">
              Average Harvest Weight:
            </span>
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

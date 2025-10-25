import React, { useState, useEffect } from "react";
import { DatePicker, Select as AntdSelect } from "antd";
import { CalendarFold, Loader2 } from "lucide-react";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

// --- TYPE DEFINITIONS ---
interface Transaction {
  date: string;
  type: string;
  description: string;
  amount: number;
}

interface TransactionHistoryProps {
  selectedBatchId: string | null;
}

// --- HELPER FUNCTION FOR CURRENCY FORMATTING ---
const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Math.abs(value));
  return value < 0 ? `(${formatted})` : formatted;
};

// --- MAIN COMPONENT ---
const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  selectedBatchId,
}) => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [filterType, setFilterType] = useState("All");
  const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);

  // Fetch transactions when the selected batch changes
  useEffect(() => {
    if (!selectedBatchId || selectedBatchId === "all") {
      setAllTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:8080/api/batches/${selectedBatchId}/transactions`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const data: Transaction[] = await response.json();
        setAllTransactions(data);
      } catch (err) {
        setError("Could not load transaction data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedBatchId]);

  // Apply filters whenever transactions or filter criteria change
  useEffect(() => {
    let data = [...allTransactions];

    // Filter by Type
    if (filterType !== "All") {
      data = data.filter((t) => t.type === filterType);
    }

    // Filter by Date Range
    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].startOf("day");
      const endDate = dates[1].endOf("day");
      data = data.filter((t) => {
        const transactionDate = dayjs(t.date);
        return (
          transactionDate.isAfter(startDate) &&
          transactionDate.isBefore(endDate)
        );
      });
    }

    setFilteredTransactions(data);
  }, [allTransactions, filterType, dates]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={4} className="h-48 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 inline-block" />
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-4 text-center text-red-500">
            {error}
          </td>
        </tr>
      );
    }

    if (!selectedBatchId || selectedBatchId === "all") {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
            Please select a batch to view its ledger.
          </td>
        </tr>
      );
    }

    if (filteredTransactions.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
            No transactions found for the selected criteria.
          </td>
        </tr>
      );
    }

    return filteredTransactions.map((transaction, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {transaction.date}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              transaction.type === "Revenue"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {transaction.type}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-800">
          {transaction.description}
        </td>
        <td
          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
            transaction.amount > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatCurrency(transaction.amount)}
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6">
      {/* --- FILTER CONTROLS --- */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="type-filter"
            className="text-sm font-medium text-gray-700"
          >
            Filter by Type:
          </label>
          <AntdSelect
            id="type-filter"
            value={filterType}
            onChange={(value) => setFilterType(value)}
            className="w-full sm:w-48"
          >
            <AntdSelect.Option value="All">All Transactions</AntdSelect.Option>
            <AntdSelect.Option value="Revenue">Revenue</AntdSelect.Option>
            <AntdSelect.Option value="Cost">Cost</AntdSelect.Option>
          </AntdSelect>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="date-filter"
            className="text-sm font-medium text-gray-700"
          >
            Date Range:
          </label>
          <RangePicker
            id="date-filter"
            format="YYYY-MM-DD"
            onChange={(dates) =>
              setDates(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])
            }
            className="w-full sm:w-64"
            suffixIcon={<CalendarFold className="text-gray-400" />}
          />
        </div>
      </div>

      {/* --- TRANSACTIONS LEDGER TABLE --- */}
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 px-6 py-4 bg-white border-b">
          Ledger for Batch
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderContent()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;

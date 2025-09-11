import React, { useState } from "react";
import { Pagination } from "antd";

interface FinancialData {
  batchId: string;
  batchName: string;
  accruedCost: number;
  estimatedRevenue: number;
  progress: number; // 0-100
  startDate: string;
  endDate: string;
}

interface FinancialForecastProps {
  data: FinancialData[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const FinancialForecast: React.FC<FinancialForecastProps> = ({ data }) => {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(3); // default 3 per page

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Financial Forecast
        </h3>
        <p className="text-gray-500">No active batches to display</p>
      </div>
    );
  }

  // Slice data for pagination
  const startIndex = (page - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Financial Forecast
        </h3>
        <span className="text-sm text-gray-500">Active Batches</span>
      </div>

      <div className="space-y-6">
        {paginatedData.map((item) => (
          <div key={item.batchId} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{item.batchName}</span>
              <span className="text-gray-500">
                {item.startDate} - {item.endDate}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Accrued Cost: {formatCurrency(item.accruedCost)}</span>
                <span>
                  Est. Revenue: {formatCurrency(item.estimatedRevenue)}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-blue-600">{item.progress}% Complete</span>
                <span className="text-gray-500">
                  {formatCurrency(item.estimatedRevenue - item.accruedCost)}{" "}
                  Projected
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Control */}
      <div className="mt-6 flex justify-center">
        <Pagination
          current={page}
          pageSize={pageSize}
          total={data.length}
          showSizeChanger
          pageSizeOptions={["3", "5", "10"]}
          onChange={(p, ps) => {
            setPage(p);
            setPageSize(ps);
          }}
          showTotal={(t, range) =>
            `${range[0]}-${range[1]} of ${t} batches`
          }
        />
      </div>
    </div>
  );
};

export default FinancialForecast;

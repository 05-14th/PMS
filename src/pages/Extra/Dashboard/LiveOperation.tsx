import { FiCalendar } from "react-icons/fi";

interface Batch {
  id: string;
  age: number;
  population: number;
  daysToHarvest?: number;
  mortality: number;
}

interface StockItem {
  id: string;
  name: string;
  level: number;
  status: string; // "Low", "Good", "Plenty", "Out of Stock"
  quantity: string;
}

interface LiveOperationProps {
  batches: Batch[];
  stockItems: StockItem[];
}

const statusStyles = {
  critical: { bar: "bg-red-600", text: "bg-red-100 text-red-800" },
  "out of stock": { bar: "bg-red-600", text: "bg-red-100 text-red-800" },
  low: { bar: "bg-amber-500", text: "bg-amber-100 text-amber-800" },
  good: { bar: "bg-green-500", text: "bg-green-100 text-green-800" },
  plenty: { bar: "bg-cyan-600", text: "bg-cyan-100 text-cyan-800" },
  default: { bar: "bg-gray-500", text: "bg-gray-100 text-gray-800" },
};

export default function LiveOperation({
  batches,
  stockItems,
}: LiveOperationProps) {
  const safeBatches = batches || [];
  const safeStockItems = stockItems || [];

  /*const getHarvestStatus = (days: number = 0) => ({
    bg: days <= 3 ? "bg-blue-50" : "bg-green-50",
    text: days <= 3 ? "text-blue-800" : "text-green-800",
  });

  const upcomingHarvests = safeBatches.filter(
    (batch) => batch.daysToHarvest !== undefined
  );*/

  return (
    <div className="space-y-6">
      {/* Active Batches */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Active Batches
        </h3>
        <div className="overflow-x-auto">
          {safeBatches.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Batch
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Age (Days)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Population
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Mortality
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {safeBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {batch.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {batch.age}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {batch.population.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600">
                      {batch.mortality.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-4">No active batches.</p>
          )}
        </div>
      </div>

      {/* Stock Status */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Stock Status
        </h3>
        <div className="space-y-4">
          {safeStockItems.length > 0 ? (
            safeStockItems.map((item) => {
              const style =
                statusStyles[
                  item.status.toLowerCase() as keyof typeof statusStyles
                ] || statusStyles.default;
              return (
                <div key={item.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${style.text}`}
                    >
                      {item.status} ({item.quantity})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${style.bar}`}
                      style={{ width: `${item.level}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-4">
              No stock items to display.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

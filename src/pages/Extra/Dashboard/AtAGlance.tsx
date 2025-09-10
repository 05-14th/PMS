import { FiDollarSign, FiPackage, FiUsers } from "react-icons/fi";

// --- UPDATED: This interface now matches the API response ---
interface AtAGlanceData {
  activeBatchCount: number;
  currentPopulation: number;
  monthlyRevenue: number;
  sellableInventory: number;
  totalBirds: number;
}

interface AtAGlanceProps {
  data: AtAGlanceData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

export default function AtAGlance({ data }: AtAGlanceProps) {
  // Defensive check in case data is not yet available
  if (!data) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Current Population Card */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">
              Current Population
            </p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              {data.currentPopulation?.toLocaleString() || 0}
            </h2>
            {/* UPDATED: Displays the active batch count */}
            <p className="text-gray-500 text-sm mt-2">
              <span>in {data.activeBatchCount} Active Batches</span>
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <FiUsers className="text-blue-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Total Birds Card */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Birds</p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              {data.totalBirds?.toLocaleString() || 0}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              <span>Across all batches</span>
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <FiUsers className="text-green-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* This Month's Revenue Card */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">
              This Month's Revenue
            </p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              {formatCurrency(data.monthlyRevenue || 0)}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              <span>In the last 30 days</span>
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <FiDollarSign className="text-purple-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Sellable Inventory Card */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">
              Sellable Inventory
            </p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              {data.sellableInventory?.toLocaleString() || 0}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              <span>Ready for market</span>
            </p>
          </div>
          <div className="p-3 bg-orange-100 rounded-full">
            <FiPackage className="text-orange-600 text-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

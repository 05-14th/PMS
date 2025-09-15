import { FiDollarSign, FiShoppingCart, FiUsers, FiFeather } from "react-icons/fi";
import { GiBirdMask, GiChicken } from "react-icons/gi";

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
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function AtAGlance({ data }: AtAGlanceProps) {
  if (!data) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Current Population Card */}
      <div className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">
              Current Population
            </p>
            <h2 className="text-3xl font-extrabold text-gray-800 mt-1 tracking-tight">
              {data.currentPopulation?.toLocaleString() || 0}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              <span>in {data.activeBatchCount} Active Batches</span>
            </p>
          </div>
          <div className="p-4 bg-blue-100 rounded-2xl group-hover:scale-110 transition-transform">
            <FiFeather className="text-blue-600 text-3xl" />
          </div>
        </div>
      </div>

      {/* Total Birds Card */}
      <div className="group bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Birds</p>
            <h2 className="text-3xl font-extrabold text-gray-800 mt-1 tracking-tight">
              {data.totalBirds?.toLocaleString() || 0}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              <span>Across all batches</span>
            </p>
          </div>
          <div className="p-4 bg-green-100 rounded-2xl group-hover:scale-110 transition-transform">
            <GiChicken className="text-green-600 text-3xl" />
          </div>
        </div>
      </div>

      {/* This Month's Revenue Card */}
      <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">
              This Month's Revenue
            </p>
            <h2 className="text-3xl font-extrabold text-gray-800 mt-1 tracking-tight">
              {formatCurrency(data.monthlyRevenue || 0)}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              <span>In the last 30 days</span>
            </p>
          </div>
          <div className="p-4 bg-purple-100 rounded-2xl group-hover:scale-110 transition-transform">
            <FiDollarSign className="text-purple-600 text-3xl" />
          </div>
        </div>
      </div>

      {/* Sellable Inventory Card */}
      <div className="group bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">
              Sellable Inventory
            </p>
            <h2 className="text-3xl font-extrabold text-gray-800 mt-1 tracking-tight">
              {data.sellableInventory?.toLocaleString() || 0}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              <span>Ready for market</span>
            </p>
          </div>
          <div className="p-4 bg-orange-100 rounded-2xl group-hover:scale-110 transition-transform">
            <FiShoppingCart className="text-orange-600 text-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

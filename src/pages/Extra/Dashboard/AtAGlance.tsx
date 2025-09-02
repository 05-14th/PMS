import { FiDollarSign, FiPackage, FiUsers, FiTrendingUp } from 'react-icons/fi';

interface DashboardData {
  currentPopulation: number;
  totalBirds: number;
  monthlyRevenue: number;
  sellableInventory: number;
  accruedCost: number;
}

interface AtAGlanceProps {
  data: DashboardData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function AtAGlance({ data }: AtAGlanceProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Current Population Card */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Current Population</p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              {data.currentPopulation}
            </h2>
            <p className="text-green-600 text-sm mt-2 flex items-center">
              <FiTrendingUp className="mr-1" />
              <span>Active Batches</span>
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <FiUsers className="text-blue-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Total Birds Card */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Birds</p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              {data.totalBirds.toLocaleString()}
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
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">This Month's Revenue</p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              {formatCurrency(data.monthlyRevenue)}
            </h2>
            <p className="text-green-600 text-sm mt-2 flex items-center">
              <FiTrendingUp className="mr-1" />
              <span>12% from last month</span>
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <FiDollarSign className="text-purple-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Sellable Inventory Card */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Sellable Inventory</p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              {data.sellableInventory.toLocaleString()}
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

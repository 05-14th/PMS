import { FiCalendar, FiPackage, FiAlertTriangle } from 'react-icons/fi';

interface Batch {
  id: string;
  age: number;
  population: number;
  daysToHarvest?: number;
}

interface StockItem {
  id: string;
  name: string;
  level: number;
  status: 'low' | 'adequate' | 'good';
  quantity: string;
}

interface LiveOperationProps {
  batches: Batch[];
  stockItems: StockItem[];
}

const statusColors = {
  low: 'bg-amber-100 text-amber-800',
  adequate: 'bg-blue-100 text-blue-800',
  good: 'bg-green-100 text-green-800',
};

export default function LiveOperation({ batches, stockItems }: LiveOperationProps) {
  const getHarvestStatus = (days: number = 0) => ({
    bg: days <= 3 ? 'bg-blue-50' : 'bg-green-50',
    text: days <= 3 ? 'text-blue-800' : 'text-green-800',
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Batches */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Batches</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Age (days)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Population</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{batch.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{batch.age}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{batch.population.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock & Alerts */}
      <div className="space-y-6">
        {/* Stock Status */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Status</h3>
          <div className="space-y-4">
            {stockItems.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status]}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    {item.quantity && ` (${item.quantity})`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      item.status === 'low' ? 'bg-amber-500' : 
                      item.status === 'adequate' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${item.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Harvests */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Harvests</h3>
          <div className="space-y-3">
            {batches
              .filter(batch => batch.daysToHarvest !== undefined)
              .map((batch) => {
                const { bg, text } = getHarvestStatus(batch.daysToHarvest);
                return (
                  <div key={`harvest-${batch.id}`} className={`p-3 rounded-lg ${bg}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{batch.id}</p>
                        <p className="text-xs flex items-center text-gray-600">
                          <FiCalendar className="mr-1" />
                          {batch.daysToHarvest === 1 
                            ? '1 day to harvest' 
                            : `~${batch.daysToHarvest} days to harvest`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${text} bg-opacity-50`}>
                        {batch.population.toLocaleString()} birds
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

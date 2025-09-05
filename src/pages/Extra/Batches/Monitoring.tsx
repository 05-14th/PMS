import React, { useState } from 'react';

interface Batch {
  id: string;
  name: string;
  startDate?: Date | string;
  currentPopulation?: number;
}

interface MonitoringProps {
  batch: Batch;
}

const eventTypes = [
  'Feeding',
  'Watering',
  'Health Check',
  'Temperature Check',
  'Weight Measurement',
  'Vaccination',
  'Mortality',
  'Other'
];

const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(new Date(date));
};

const Monitoring: React.FC<MonitoringProps> = ({ batch }) => {
  const [selectedEventType, setSelectedEventType] = useState<string>('');

  // Use provided start date or default to current date
  const startDate = batch.startDate || new Date();
  // Calculate age in days
  const ageInDays = Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

  const handleRecordConsumption = () => {
    if (!selectedEventType) return;
    // TODO: Implement record consumption logic
    console.log(`Recording consumption for event: ${selectedEventType}`);
    // Reset selection after recording
    setSelectedEventType('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Batch Monitoring</h2>

      {/* Batch Vitals Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Vitals</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="mt-1">
              <input
                type="text"
                readOnly
                value={formatDate(startDate)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50"
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <div className="mt-1">
              <input
                type="text"
                readOnly
                value={`${ageInDays} days`}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50"
              />
            </div>
          </div>

          {/* Current Population */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Population
            </label>
            <div className="mt-1">
              <input
                type="text"
                readOnly
                value={batch.currentPopulation || 'N/A'}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Record Daily Event Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Record a daily event</h3>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="event-type" className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              id="event-type"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="">Select an event type</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end space-x-3">
            <button
              type="button"
              onClick={handleRecordConsumption}
              disabled={!selectedEventType}
              className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                selectedEventType
                  ? 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Record Consumption
            </button>
            <button
              type="button"
              onClick={() => {}}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Event History Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Events Log</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty/Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Example row - replace with dynamic data */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(new Date())}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Feeding
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Starter feed
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  100 kg
                </td>
              </tr>
              {/* Add more rows dynamically based on your data */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(new Date(Date.now() - 86400000))} {/* Yesterday */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Health Check
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Routine checkup
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  50
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Costs Table */}
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Direct Costs Log</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Example row - replace with dynamic data */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(new Date())}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Feed
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Starter feed purchase
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₱5,000.00
                </td>
              </tr>
              {/* Add more rows dynamically based on your data */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(new Date(Date.now() - 86400000))} {/* Yesterday */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Medication
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Routine vitamins
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₱2,500.00
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  Total:
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₱7,500.00
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Monitoring;
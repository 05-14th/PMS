import React, { useState, useEffect } from "react";
import axios from "axios";
import { message } from "antd";
import dayjs from "dayjs";
import ConsumptionForm from "./ConsumptionForm";
import HealthCheckForm from "./HealthCheckForm";
import MortalityForm from "./MortalityForm";
import DirectCostForm from "./DirectCostForm";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";

interface Batch {
  batchID: number;
  batchName: string;
}

interface BatchVitals {
  batchName: string;
  startDate: string;
  endDate?: string | null;
  ageInDays: number;
  currentPopulation: number;
  totalMortality: number;
}

interface BatchEvent {
  id: number;
  type: string;
  date: string;
  event: string;
  details: string;
  qty: string;
}

interface BatchCost {
  id: number;
  date: string;
  type: string;
  description: string;
  amount: number;
}

interface MonitoringProps {
  batch: Batch;
  onDataChange?: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const Monitoring: React.FC<MonitoringProps> = ({ batch, onDataChange }) => {
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [vitals, setVitals] = useState<BatchVitals | null>(null);
  const [events, setEvents] = useState<BatchEvent[]>([]);
  const [costs, setCosts] = useState<BatchCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [isCostModalVisible, setIsCostModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<BatchCost | null>(null);

  // State for all modals
  const [isConsumptionModalVisible, setIsConsumptionModalVisible] =
    useState(false);
  const [isMortalityModalVisible, setIsMortalityModalVisible] = useState(false);
  const [isHealthCheckModalVisible, setIsHealthCheckModalVisible] =
    useState(false);

  const fetchMonitoringData = async () => {
    if (!batch?.batchID) return;
    setLoading(true);
    try {
      const [vitalsRes, eventsRes, costsRes, categoriesRes] = await Promise.all(
        [
          api.get(`/api/batches/${batch.batchID}/vitals`),
          api.get(`/api/batches/${batch.batchID}/events`),
          api.get(`/api/batches/${batch.batchID}/costs`),
          api.get("/api/categories"),
        ]
      );
      setVitals(vitalsRes.data);
      setEvents(eventsRes.data.data || []);
      setCosts(costsRes.data.data || []);
      const fetchedCategories: string[] = categoriesRes.data || [];
      const staticEvents = ["Mortality", "Health Check", "Other"];
      setEventTypes([...fetchedCategories, ...staticEvents]);
    } catch (error) {
      message.error("Failed to load monitoring data for this batch.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [batch?.batchID]);

  // edit by front end to have a UI for window confirm
  const handleDeleteEvent = async (eventId: number, eventType: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/events/${eventType}/${eventId}`);
      message.success("Event deleted and stock has been restored.");
      fetchMonitoringData(); // Refresh data
      onDataChange();
    } catch (error) {
      message.error("Failed to delete the event.");
    }
  };

  const handleAddEntry = () => {
    const event = selectedEventType;
    if (
      event === "Feed" ||
      event === "Medicine" ||
      event === "Vitamins" ||
      event === "Equipment" ||
      event === "Miscellaneous"
    ) {
      setIsConsumptionModalVisible(true);
    } else if (event === "Mortality") {
      setIsMortalityModalVisible(true);
    } else if (event === "Health Check") {
      setIsHealthCheckModalVisible(true);
    } else {
      // This handles any other types, like "Other"
      message.info(`'Add Entry' for ${event} can be built next.`);
    }
  };

  const handleEntrySubmit = () => {
    setIsConsumptionModalVisible(false);
    setIsMortalityModalVisible(false);
    setIsHealthCheckModalVisible(false);
    setIsCostModalVisible(false);
    fetchMonitoringData();
    setEditingCost(null);
    onDataChange();
  };

  const formatDate = (date: Date | string): string => {
    return dayjs(date).format("MMM D, YYYY");
  };

  if (loading) {
    return <div className="p-4">Loading monitoring data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Batch Monitoring</h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Vitals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="text"
              readOnly
              value={vitals ? formatDate(vitals.startDate) : "N/A"}
              className="block w-full rounded-md border-gray-300 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {vitals?.endDate ? "End Date" : "Age"}
            </label>
            <input
              type="text"
              readOnly
              value={
                vitals
                  ? vitals.endDate
                    ? formatDate(vitals.endDate)
                    : `${vitals.ageInDays} days`
                  : "N/A"
              }
              className="block w-full rounded-md border-gray-300 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Population
            </label>
            <input
              type="text"
              readOnly
              value={vitals ? vitals.currentPopulation : "N/A"}
              className="block w-full rounded-md border-gray-300 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Mortality
            </label>
            <input
              type="text"
              readOnly
              value={vitals ? vitals.totalMortality : "N/A"}
              className="block w-full rounded-md border-gray-300 bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* --- Record a daily event Section (No Changes) --- */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Record a daily event
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <label
              htmlFor="event-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Event Type
            </label>
            <select
              id="event-type"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="block w-full rounded-md border-gray-300"
            >
              <option value="">Select an event type</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddEntry}
              disabled={!selectedEventType}
              className={`px-4 py-2 border text-sm font-medium rounded-md text-white ${selectedEventType ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"}`}
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Daily Events Log
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Qty/Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={`${event.type}-${event.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(event.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.event}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {event.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.type)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Event"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Direct Costs Log
          </h3>
          <button
            onClick={() => setIsCostModalVisible(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Cost
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cost Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costs.map((cost) => (
                <tr key={cost.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(cost.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowe text-sm font-medium text-gray-900">
                    {cost.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cost.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₱{cost.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          setEditingCost(cost);
                          setIsCostModalVisible(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Cost"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(cost.id, "cost")}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Cost"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-right text-sm font-medium text-gray-900"
                >
                  Total:
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₱
                  {costs.reduce((sum, cost) => sum + cost.amount, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <ConsumptionForm
        visible={isConsumptionModalVisible}
        batchID={batch.batchID}
        eventType={selectedEventType}
        onCancel={() => setIsConsumptionModalVisible(false)}
        onSubmit={handleEntrySubmit}
      />
      <MortalityForm
        visible={isMortalityModalVisible}
        batchID={batch.batchID}
        onCancel={() => setIsMortalityModalVisible(false)}
        onSubmit={handleEntrySubmit}
      />
      <HealthCheckForm
        visible={isHealthCheckModalVisible}
        batchID={batch.batchID}
        onCancel={() => setIsHealthCheckModalVisible(false)}
        onSubmit={handleEntrySubmit}
      />
      <DirectCostForm
        visible={isCostModalVisible}
        batchID={batch.batchID}
        initialValues={editingCost}
        onCancel={() => {
          setIsCostModalVisible(false);
          setEditingCost(null);
        }}
        onSubmit={handleEntrySubmit}
      />
    </div>
  );
};
export default Monitoring;

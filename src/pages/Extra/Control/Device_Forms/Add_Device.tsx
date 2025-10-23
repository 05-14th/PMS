import React, { useState } from "react";
import axios from "axios";

interface AddDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (ipAddress: string, deviceType: string) => void;
}

const AddDevice: React.FC<AddDeviceProps> = ({
  isOpen,
  onClose,
  onAddDevice,
}) => {
  const [ipAddress, setIpAddress] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [error, setError] = useState("");
  const [customType, setCustomType] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    ipAddress: string;
    deviceType: string;
  } | null>(null);
  const serverHost = import.meta.env.VITE_APP_SERVERHOST;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    // Basic validation
    const ip = ipAddress.trim();
    if (!ip) {
      setError("IP Address is required");
      return;
    }

    const selectedType = (showCustomInput ? customType : deviceType).trim();
    if (!selectedType) {
      setError("Please enter or select a device type");
      return;
    }

    try {
      // Save to backend
      const response = await axios.post(serverHost + "/api/iot/manageDevices", {
        ipAddress: ip,
        deviceType: selectedType,
      });
      console.log("Device added successfully:", response.data);

      // Update parent and any local state you keep
      onAddDevice(ip, selectedType);
      setDeviceInfo({ ipAddress: ip, deviceType: selectedType });

      // Reset form and close
      setIpAddress("");
      setDeviceType("");
      setCustomType("");
      setError("");
      setShowCustomInput(false);
      onClose();
    } catch (error: any) {
      console.error("Error adding device:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add device";
      setError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Add New Device
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="ipAddress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              IP Address:
            </label>
            <input
              type="text"
              id="ipAddress"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter device IP address"
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="deviceType"
                className="block text-sm font-medium text-gray-700"
              >
                Device :
              </label>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-xs text-green-600 hover:text-green-800"
              >
                {showCustomInput ? "Select from list" : "Select one"}
              </button>
            </div>

            {showCustomInput ? (
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter device type"
              />
            ) : (
              <select
                id="deviceType"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="Watering">Watering</option>
                <option value="Feeding">Feeding</option>
                <option value="Medicine">Medicine</option>
                <option value="Lighting">Lighting</option>
                <option value="Custom">Custom</option>
              </select>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDevice;

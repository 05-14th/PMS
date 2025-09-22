import React, { useState } from "react";

interface FormData {
  startTime: string;
  endTime: string;
  light: boolean;
  medicine: boolean;
}

const Automation_Form: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    startTime: "",
    endTime: "",
    light: false,
    medicine: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    onClose();
  };

  return (
    <div className="backdrop-blur-md bg-white/30 p-6 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Start Time
          </label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="w-full p-2 bg-white/50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            End Time
          </label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="w-full p-2 bg-white/50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            required
          />
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="light"
              checked={formData.light}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-800">Light</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="medicine"
              checked={formData.medicine}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-800">Medicine</span>
          </label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-white/70 text-gray-800 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default Automation_Form;

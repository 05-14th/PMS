import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface LightFormProps {
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => void;
}

const Light_Form: React.FC<LightFormProps> = ({ onClose, onSave }) => {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(startTime, endTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white/95 rounded-lg p-6 w-full max-w-md shadow-xl backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-center">Light Automation</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Light_Form;
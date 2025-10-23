import React, { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import Automation_Form from './Automation/Automation_Form';
import Add_Device from './Device_Forms/Add_Device';
import { a } from 'framer-motion/client';
import axios from 'axios';

interface ToggleManualAutoModeProps {
  isAuto: boolean;
  onToggle: (isAuto: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const ToggleManualAutoMode: React.FC<ToggleManualAutoModeProps> = ({
  isAuto: externalIsAuto,
  onToggle,
  label = 'Control Mode',
  className = '',
  disabled = false
}) => {
  const [isAuto, setIsAuto] = useState(externalIsAuto);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  // Sync with external state
  useEffect(() => {
    setIsAuto(externalIsAuto);
  }, [externalIsAuto]);

  const handleToggle = () => {
    if (!disabled) {
      const newMode = !isAuto;
      setIsAuto(newMode);
      onToggle(newMode);
    }
  };

  const handleScheduleClick = () => {
    setShowSchedule(true);
  };

  const handleCloseSchedule = () => {
    setShowSchedule(false);
  };

  const handleAddDeviceClick = () => {
    setShowAddDevice(true);
  };

  const handleCloseAddDevice = () => {
    setShowAddDevice(false);
  };

  // Store added device info to backend
  const handleAddDevice = (ipAddress: string, deviceType: string) => {
    console.log('Adding device:', { ipAddress, deviceType });
   
  };

  return (
    <>
      <div className={`fixed right-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200 ${className} 
        top-20 sm:top-4 transition-all duration-300 w-auto`}>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center">
            <span className="mr-3 text-sm font-medium text-gray-700">
              {label}:
              <span className={`ml-1 font-semibold ${isAuto ? 'text-green-600' : 'text-green-600'}`}>
                {isAuto ? 'Auto' : 'Manual'}
              </span>
            </span>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                isAuto ? 'bg-green-500' : 'bg-green-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleToggle}
              aria-pressed={isAuto}
              disabled={disabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isAuto ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleAddDeviceClick}
              className="flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                       bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Device</span>
            </button>
            
            <button
              onClick={handleScheduleClick}
              disabled={!isAuto || disabled}
              className={`flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors whitespace-nowrap ${
                isAuto && !disabled
                  ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-blue-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Calendar className="w-4 h-4 mr-1" />
              <span className="sm:hidden">Sched</span>
              <span className="hidden sm:inline">Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white/90 rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Device</h2>
              <button 
                onClick={handleCloseAddDevice}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <Add_Device 
              isOpen={showAddDevice} 
              onClose={handleCloseAddDevice} 
              onAddDevice={handleAddDevice}
            />
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white/90 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4 w-full">
          
              <button 
                onClick={handleCloseSchedule}
                className="text-gray-500 hover:text-gray-700 ml-auto"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <Automation_Form onClose={handleCloseSchedule} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ToggleManualAutoMode;
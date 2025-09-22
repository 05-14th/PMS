import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import Automation_Form from './Automation/Automation_Form';

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

  return (
    <>
      <div className={`fixed right-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200 ${className} 
        top-20 sm:top-4 transition-all duration-300`}>
        <div className="flex flex-col space-y-3">
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
          
          <button
            onClick={handleScheduleClick}
            disabled={!isAuto || disabled}
            className={`flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isAuto && !disabled
                ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-blue-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </button>
        </div>
      </div>

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
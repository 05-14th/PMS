import React, { useState, useEffect } from 'react';

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

  return (
    <div className={`fixed right-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200 ${className} 
      top-20 sm:top-4 transition-all duration-300`}>
      <div className="flex items-center">
        <span className="mr-3 text-sm font-medium text-gray-700">
          {label}:
          <span className={`ml-1 font-semibold ${isAuto ? 'text-green-600' : 'text-green-600'}`}>
            {isAuto ? 'Auto' : 'Manual'}
          </span>
        </span>
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
    </div>
  );
};

export default ToggleManualAutoMode;
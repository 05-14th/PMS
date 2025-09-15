import React, { useState } from "react";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";
import { FaFan, FaLightbulb } from "react-icons/fa6";

const Environmental: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Cage 1");
  const [fanOn, setFanOn] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);

  const tabs = ["Cage 1", "Cage 2", "Cage 3"];

  const handleFanToggle = () => {
    if (isAutoMode) return;
    setFanOn(!fanOn);
    // Add your fan control API call here
  };

  const handleLightsToggle = () => {
    if (isAutoMode) return;
    setLightsOn(!lightsOn);
    // Add your lights control API call here
  };

  return (
    <div className="relative p-4">
      <ToggleManualAutoMode 
        isAuto={isAutoMode} 
        onToggle={setIsAutoMode}
        className="fixed top-4 right-4 z-50"
      />
      
      <div className={`${isAutoMode ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Sub Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-4 border-b border-gray-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => !isAutoMode && setActiveTab(tab)}
              className={`pb-2 text-xs sm:text-sm font-medium ${
                activeTab === tab
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-700"
              } ${isAutoMode ? 'cursor-not-allowed' : ''}`}
              disabled={isAutoMode}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sensors Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-green-600 text-xs sm:text-sm font-medium mb-1">Temperature</h3>
            <div className="w-full h-12 border border-gray-300 rounded-lg flex items-center justify-center text-sm">
              25°C
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-green-600 text-xs sm:text-sm font-medium mb-1">Air Quality</h3>
            <div className="w-full h-12 border border-gray-300 rounded-lg flex items-center justify-center text-sm">
              Good
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-green-600 text-xs sm:text-sm font-medium mb-1">Humidity</h3>
            <div className="w-full h-12 border border-gray-300 rounded-lg flex items-center justify-center text-sm">
              60%
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fan Control */}
          <div className="bg-white rounded-lg shadow-sm p-3 flex flex-col items-center">
            <h3 className="text-green-600 text-xs sm:text-sm font-medium flex items-center mb-2">
              <FaFan className="mr-1" /> Fan
            </h3>
            <button
              onClick={handleFanToggle}
              disabled={isAutoMode}
              className={`w-full py-2 px-3 text-xs sm:text-sm rounded-lg font-medium ${
                fanOn
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              } ${isAutoMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {fanOn ? 'Turn Off' : 'Turn On'}
            </button>
          </div>

          {/* Lights Control */}
          <div className="bg-white rounded-lg shadow-sm p-3 flex flex-col items-center">
            <h3 className="text-green-600 text-xs sm:text-sm font-medium flex items-center mb-2">
              <FaLightbulb className="mr-1" /> Lights
            </h3>
            <button
              onClick={handleLightsToggle}
              disabled={isAutoMode}
              className={`w-full py-2 px-3 text-xs sm:text-sm rounded-lg font-medium ${
                lightsOn
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              } ${isAutoMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {lightsOn ? 'Turn Off' : 'Turn On'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Environmental;

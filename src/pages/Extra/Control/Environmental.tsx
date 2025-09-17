import React, { useState } from "react";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";
import Cage1 from "./Monitoring_Environmental/Cage1";
import Cage2 from "./Monitoring_Environmental/Cage2";
import Cage3 from "./Monitoring_Environmental/Cage3";

const cageComponents = {
  "Cage 1": Cage1,
  "Cage 2": Cage2,
  "Cage 3": Cage3,
} as const;

const Environmental: React.FC = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof cageComponents>("Cage 1");
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);
  const tabs = Object.keys(cageComponents) as Array<keyof typeof cageComponents>;
  const ActiveCage = cageComponents[activeTab];

  return (
    <div className="relative p-4">
      <ToggleManualAutoMode 
        isAuto={isAutoMode} 
        onToggle={setIsAutoMode}
        className="fixed top-4 right-4 z-50"
      />
      
      <div className={`${isAutoMode ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Sub Tabs */}
        <div className="flex flex-wrap justify-center space-x-2 sm:space-x-4 border-b border-gray-200 mb-4">
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
        
        {/* Render the active cage component */}
        <div className="mt-4">
          <ActiveCage isAutoMode={isAutoMode} />
        </div>
      </div>
    </div>
  );
};

export default Environmental;

import React, { useState } from "react";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";
import Cage1 from "./Monitoring_Environmental/Cage1";
import Cage2 from "./Monitoring_Environmental/Cage2";
import Cage3 from "./Monitoring_Environmental/Cage3";
import { FaFan, FaLightbulb } from "react-icons/fa";

interface EnvironmentalProps {
  batchID: number | undefined;
}

interface CageProps {
  isAutoMode: boolean;
  batchID: number | undefined;
}

const cageComponents = {
  "Cage 1": Cage1 as React.FC<CageProps>,
  "Cage 2": Cage2 as React.FC<CageProps>,
  "Cage 3": Cage3 as React.FC<CageProps>,
} as const;

const Environmental: React.FC<EnvironmentalProps> = ({ batchID }) => {
  const [activeTab, setActiveTab] =
    useState<keyof typeof cageComponents>("Cage 1");
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);
  const [isFanOn, setIsFanOn] = useState<boolean>(false);
  const [isLightOn, setIsLightOn] = useState<boolean>(false);
  const tabs = Object.keys(cageComponents) as Array<
    keyof typeof cageComponents
  >;
  const ActiveCage = cageComponents[activeTab];

  return (
    <div className="relative p-4">
      <ToggleManualAutoMode
        isAuto={isAutoMode}
        onToggle={setIsAutoMode}
        className="fixed top-4 right-4 z-50"
      />

      {/* Sub Tabs - Always enabled */}
      <div className="flex flex-wrap justify-center space-x-2 sm:space-x-4 border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-xs sm:text-sm font-medium ${
              activeTab === tab
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cage Content - Always enabled */}
      <div className="mt-4">
        <ActiveCage isAutoMode={isAutoMode} batchID={batchID} />
      </div>

      {/* Control Buttons - Disabled in auto mode */}
      <div
        className={`flex justify-center space-x-6 my-6 ${isAutoMode ? "opacity-50" : ""}`}
      >
        {/* Fan Button */}
        <button
          onClick={() => setIsFanOn(!isFanOn)}
          disabled={isAutoMode}
          className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isFanOn
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          } ${isAutoMode ? "cursor-not-allowed" : "hover:bg-green-50"}`}
        >
          <FaFan
            className={`text-3xl mb-2 ${isFanOn ? "text-green-600 animate-spin" : "text-gray-500"}`}
          />
          <span className="font-medium">Fan</span>
          <span className="text-sm">{isFanOn ? "ON" : "OFF"}</span>
        </button>

        {/* Lights Button */}
        <button
          onClick={() => setIsLightOn(!isLightOn)}
          disabled={isAutoMode}
          className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isLightOn
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          } ${isAutoMode ? "cursor-not-allowed" : "hover:bg-green-50"}`}
        >
          <FaLightbulb
            className={`text-3xl mb-2 ${isLightOn ? "text-yellow-400" : "text-gray-500"}`}
          />
          <span className="font-medium">Lights</span>
          <span className="text-sm">{isLightOn ? "ON" : "OFF"}</span>
        </button>
      </div>
    </div>
  );
};

export default Environmental;

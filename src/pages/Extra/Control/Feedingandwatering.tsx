import React, { useState } from "react";
import { Droplets, Pill, Utensils } from "lucide-react";
import axios from "axios";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";
import Feeding from "./Monitoring_FeedingWatering/Feeding";
import WaterAndMedicine from "./Monitoring_FeedingWatering/WaterAndMedicine";

interface FeedingandwateringProps {
  batchID: number | undefined;
}

const Feedingandwatering: React.FC<FeedingandwateringProps> = ({ batchID }) => {
  const [relayState, setRelayState] = useState({ relay1: 0, relay2: 0, relay3: 0 });
  const [medRelayState, setMedRelayState] = useState({ relay_med1: 0, relay_med2: 0, relay_med3: 0 });
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("Control");

  const serverHost = (import.meta.env.VITE_APP_SERVERHOST as string)?.replace(/\/+$/, "") || "";

  const tabComponents: Record<string, React.ReactNode> = {
    Control: <Feeding batchID={batchID} />,
    Monitoring: <WaterAndMedicine batchID={batchID} />,
  };

  const handleToggleMode = (isAuto: boolean) => {
    setIsAutoMode(isAuto);
    // No device detection or proxy calls
  };

  // Modified: call gateway server directly, using serverHost, like your PowerShell curl
  // curl -Method POST "http://192.168.1.111:8080/push/esp-0F6088" -Headers @{ "Content-Type" = "application/json" } -Body '{"relay":3,"pulse_ms":1000}'
  const handleFeedRotate = async (relay: number) => {
    try {
      await axios.post(
        `${serverHost}/push/esp-0F6088`,
        { relay, pulse_ms: 1000 },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(`Feed rotation triggered for relay ${relay}`);
    } catch (e) {
      console.warn("Feed rotate request failed");
    }
  };

  // Placeholders to keep UI compiling without device discovery
  const handleWaterToggle = async (relay: number) => {
    console.warn("Water toggle is not configured in this build");
    const key = `relay${relay}` as keyof typeof relayState;
    const next = relayState[key] ? 0 : 1;
    setRelayState((prev) => ({ ...prev, [key]: next } as any));
  };

  const handleMedicine = async (relay: number) => {
    console.warn("Medicine toggle is not configured in this build");
    const key = `relay_med${relay}` as keyof typeof medRelayState;
    const next = medRelayState[key] ? 0 : 1;
    setMedRelayState((prev) => ({ ...prev, [key]: next } as any));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 relative">
      <ToggleManualAutoMode
        isAuto={isAutoMode}
        onToggle={handleToggleMode}
        className="absolute right-4 top-4"
      />

      {/* Tabs */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-center border-b border-gray-300">
          {["Control", "Monitoring"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "text-green-700 border-b-2 border-green-500"
                  : "text-gray-500 hover:text-green-600"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">{tabComponents[activeTab]}</div>
      </div>

      {/* Feeder Controls, Water, Medicine */}
      <div className="flex flex-col items-center gap-6 mt-6">
        {/* Feed */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Feed</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  className={`py-3 text-sm sm:text-base font-semibold transition border-2 shadow-sm rounded-lg ${
                    isAutoMode
                      ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                  }`}
                  disabled={isAutoMode}
                  aria-disabled={isAutoMode}
                  onClick={() => handleFeedRotate(num)}
                >
                  {["Starter", "Grower", "Finisher"][num - 1]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Water */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Water</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex flex-col">
                  <div className="mb-2 p-2 bg-gray-0 border border-pink-200 rounded-lg h-16 flex items-center justify-center text-xs text-gray-600 text-center">
                    Water level monitoring placeholder
                  </div>
                  <button
                    className={`aspect-square w-full flex items-center justify-center text-lg font-semibold transition border-2 rounded-full ${
                      isAutoMode
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : relayState[`relay${num}` as keyof typeof relayState]
                          ? "bg-green-200 border-green-500 text-green-900"
                          : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                    }`}
                    onClick={() => handleWaterToggle(num)}
                    disabled={isAutoMode}
                    aria-disabled={isAutoMode}
                  >
                    {num}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medicine */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Pill className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Medicine</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex flex-col">
                  <div className="mb-2 p-2 bg-gray-0 border border-pink-200 rounded-lg h-16 flex items-center justify-center text-xs text-gray-600 text-center">
                    Medicine level monitoring placeholder
                  </div>
                  <button
                    className={`aspect-square w-full flex items-center justify-center text-lg font-semibold transition border-2 rounded-full ${
                      isAutoMode
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : medRelayState[`relay_med${num}` as keyof typeof medRelayState]
                          ? "bg-green-200 border-green-500 text-green-900"
                          : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                    }`}
                    onClick={() => handleMedicine(num)}
                    disabled={isAutoMode}
                    aria-disabled={isAutoMode}
                  >
                    {num}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>{/* end flex column */}
    </div>
  );
};

export default Feedingandwatering;

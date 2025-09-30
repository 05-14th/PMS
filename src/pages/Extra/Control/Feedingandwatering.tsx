import React, { useState } from "react";
import { Droplets, Pill, Utensils } from "lucide-react";
import axios from "axios";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";
import Feeding from "./Monitoring_FeedingWatering/Feeding";
import WaterAndMedicine from "./Monitoring_FeedingWatering/WaterAndMedicine";

const Feedingandwatering: React.FC = () => {
  const [relayState, setRelayState] = useState<{ relay1: number, relay2: number, relay3: number }>({ relay1: 0, relay2: 0, relay3: 0 });
  const [waterLevel, setWaterLevel] = useState<{ water1: number, water2: number, water3: number }>({ water1: 0, water2: 0, water3: 0 });
  const [medRelayState, setMedRelayState] = useState<{ relay_med1: number, relay_med2: number, relay_med3: number }>({ relay_med1: 0, relay_med2: 0, relay_med3: 0 });
  const [medicine, setMedicine] = useState<{ med1: number, med2: number, med3: number }>({ med1: 0, med2: 0, med3: 0 });
  const [waterState, setWaterState] = useState<string>("Empty");
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("Feeding");

  // Map tab names to components
  const tabComponents: { [key: string]: React.ReactNode } = {
    "Feeding": <Feeding />,
    "Water & Medicine": <WaterAndMedicine />
  };

  React.useEffect(() => {
    axios.get("http://192.168.1.16/telemetry")
      .then(response => {
        const data = response.data;
        setRelayState({
          relay1: data.relay1,
          relay2: data.relay2,
          relay3: data.relay3
        });
      })
      .catch(error => {
        console.error("Error fetching telemetry data:", error);
      });
  }, []);

  const handleToggleMode = (isAuto: boolean) => {
    setIsAutoMode(isAuto);
    if (isAuto) {
      postModeChange("automatic");
    }else{
      postModeChange("manual");
    }
    
  };

  const postModeChange = (mode: string) => {
    axios.post("http://192.168.1.9/set-relays", {
      "relay1": 0,
      "relay2": 0,
      "relay3": 0,
      "mode": mode}
  )
      .then(response => console.log("Mode changed:", response.data))
      .catch(error => console.error("Error changing mode:", error));
  }
  
  // Rotate servo for feed buttons
  const handleFeedRotate = async (relay: number) => {
    try {
      const { data } = await axios.post(
        "http://192.168.1.17/rotate-servo",
        { relay },
        { headers: { "Content-Type": "application/json" }, timeout: 3000 }
      );
      console.log("Relay triggered:", data); // { success: true, relay: n }
    } catch (err: any) {
      if (err.response) console.error("HTTP error", err.response.status, err.response.data);
      else if (err.request) console.error("No response from ESP", err.message);
      else console.error("Request setup error", err.message);
    }
  };


  const handleWaterToggle = (relayNum: number) => {
    if (isAutoMode) return;
    const newState = { ...relayState };
    newState[`relay${relayNum}` as keyof typeof newState] =
      relayState[`relay${relayNum}` as keyof typeof newState] ? 0 : 1;
    setRelayState(newState);
    axios.post("http://192.168.1.16/set-relays", newState)
      .then(response => console.log("Watering successful:", response.data))
      .catch(error => console.error("Error watering:", error));
  };

  const handleMedecine = (relayNum: number) => {
    if (isAutoMode) return;
    const newState = { ...medRelayState };
    newState[`relay_med${relayNum}` as keyof typeof newState] =
      medRelayState[`relay_med${relayNum}` as keyof typeof newState] ? 0 : 1;
    setMedRelayState(newState);
    axios.post("http://192.168.1.16/set-relays", newState)
      .then(response => console.log("Medicine relay toggled:", response.data))
      .catch(error => console.error("Error toggling medicine relay:", error));
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
          {["Feeding", "Water & Medicine"].map((tab) => (
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

        {/* Selected Tab Component */}
        <div className="mt-6">
          {tabComponents[activeTab]}
        </div>
      </div>

      {/* Feed/Water/Medicine Control Sections */}
      <div className="flex flex-col items-center gap-6 mt-6">
        {/* Feed Section */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Feed</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              <button
                className={`py-3 text-sm sm:text-base font-semibold transition border-2 shadow-sm rounded-lg ${
                  isAutoMode
                    ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                    : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                }`}
                disabled={isAutoMode}
                aria-disabled={isAutoMode}
                onClick={() => handleFeedRotate(1)}
              >
                Starter
              </button>
              <button
                className={`py-3 text-sm sm:text-base font-semibold transition border-2 shadow-sm rounded-lg ${
                  isAutoMode
                    ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                    : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                }`}
                disabled={isAutoMode}
                aria-disabled={isAutoMode}
                onClick={() => handleFeedRotate(2)}
              >
                Grower
              </button>
              <button
                className={`py-3 text-sm sm:text-base font-semibold transition border-2 shadow-sm rounded-lg ${
                  isAutoMode
                    ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                    : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                }`}
                disabled={isAutoMode}
                aria-disabled={isAutoMode}
                onClick={() => handleFeedRotate(3)}
              >
                Finisher
              </button>
            </div>
          </div>
        </div>

        {/* Water Section */}
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
                    Put the Water level Sensor Monitoring Here para sa bahogan 
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

        {/* Medicine Section */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Pill className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Medicine</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex flex-col">
                  <div className="mb-2 p-2 bg-gray-0  border border-pink-200 rounded-lg h-16 flex items-center justify-center text-xs text-gray-600 text-center">
                    Put the Medicine level Sensor Monitoring Here para sa bahogan
                  </div>
                  <button
                    className={`aspect-square w-full flex items-center justify-center text-lg font-semibold transition border-2 rounded-full ${
                      isAutoMode
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : medRelayState[`relay_med${num}` as keyof typeof medRelayState]
                        ? "bg-green-200 border-green-500 text-green-900"
                        : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                    }`}
                    onClick={() => handleMedecine(num)}
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
      </div>
    </div>
  );
};

export default Feedingandwatering;
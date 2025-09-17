import React, { useState } from "react";
import { Droplets, Pill, Utensils } from "lucide-react";
import axios from "axios";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";
import Cage_1 from  "./Monitoring_FeedingWatering/Cage_1";
import Cage_2 from "./Monitoring_FeedingWatering/Cage_2";
import Cage_3 from  "./Monitoring_FeedingWatering/Cage_3";

const Feedingandwatering: React.FC = () => {
  const [relayState, setRelayState] = useState<{ relay1: number, relay2: number, relay3: number }>({ relay1: 0, relay2: 0, relay3: 0 });
  const [waterLevel, setWaterLevel] = useState<{ water1: number, water2: number, water3: number }>({ water1: 0, water2: 0, water3: 0 });
  const [medRelayState, setMedRelayState] = useState<{ relay_med1: number, relay_med2: number, relay_med3: number }>({ relay_med1: 0, relay_med2: 0, relay_med3: 0 });
  const [medicine, setMedicine] = useState<{ med1: number, med2: number, med3: number }>({ med1: 0, med2: 0, med3: 0 });
  const [waterState, setWaterState] = useState<string>("Empty");
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [activeCage, setActiveCage] = useState<string>("Cage 1");

  // Map cage names to components
  const cageComponents: { [key: string]: React.ReactNode } = {
    "Cage 1": <Cage_1 />,
    "Cage 2": <Cage_2 />,
    "Cage 3": <Cage_3 />
  };

  React.useEffect(() => {
    axios.get("http://192.168.1.56/telemetry")
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
  };

  const handleWaterToggle = (relayNum: number) => {
    if (isAutoMode) return;
    const newState = { ...relayState };
    newState[`relay${relayNum}` as keyof typeof newState] =
      relayState[`relay${relayNum}` as keyof typeof newState] ? 0 : 1;
    setRelayState(newState);
    axios.post("http://192.168.1.56/set-relays", newState)
      .then(response => console.log("Watering successful:", response.data))
      .catch(error => console.error("Error watering:", error));
  };

  const handleMedecine = (relayNum: number) => {
    if (isAutoMode) return;
    const newState = { ...medRelayState };
    newState[`relay_med${relayNum}` as keyof typeof newState] =
      medRelayState[`relay_med${relayNum}` as keyof typeof newState] ? 0 : 1;
    setMedRelayState(newState);
    axios.post("http://192.168.1.58/set-relays", newState)
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

      {/* Cage Tabs */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-center border-b border-gray-300">
          {["Cage 1", "Cage 2", "Cage 3"].map((cage) => (
            <button
              key={cage}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeCage === cage
                  ? "text-green-700 border-b-2 border-green-500"
                  : "text-gray-500 hover:text-green-600"
              }`}
              onClick={() => setActiveCage(cage)}
            >
              {cage}
            </button>
          ))}
        </div>

        {/* Selected Cage Component */}
        <div className="mt-6">
          {cageComponents[activeCage]}
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
              {["Starter", "Grower", "Finisher"].map((label) => (
                <button
                  key={label}
                  className={`py-3 text-sm sm:text-base font-semibold transition border-2 shadow-sm rounded-lg ${
                    isAutoMode
                      ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                  }`}
                  disabled={isAutoMode}
                  aria-disabled={isAutoMode}
                >
                  {label}
                </button>
              ))}
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
                <button
                  key={num}
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
                <button
                  key={num}
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedingandwatering;
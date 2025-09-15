import React, { useState } from "react";
import { Droplets, Pill } from "lucide-react";
import axios from "axios";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";

const Feedingandwatering: React.FC = () => {
  const [relayState, setRelayState] = useState<{ relay1: number, relay2: number, relay3: number }>({ relay1: 0, relay2: 0, relay3: 0 });
  const [waterLevel, setWaterLevel] = useState<{ water1: number, water2: number, water3: number }>({ water1: 0, water2: 0, water3: 0 });
  const [medRelayState, setMedRelayState] = useState<{ relay_med1: number, relay_med2: number, relay_med3: number }>({ relay_med1: 0, relay_med2: 0, relay_med3: 0 });
  const [medicine, setMedicine] = useState<{ med1: number, med2: number, med3: number }>({ med1: 0, med2: 0, med3: 0 });
  const [waterState, setWaterState] = useState<string>("Empty");
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);

  React.useEffect(() => {
    // Fetch initial relay states and water level from the backend
    axios.get('http://192.168.1.56/telemetry')
      .then(response => {
        const data = response.data;
        setRelayState({
          relay1: data.relay1,
          relay2: data.relay2, 
          relay3: data.relay3
        });
        setWaterLevel({ water1: data.water1, water2: data.water2, water3: data.water3 });
        // Calculate percentage
        const total = (data.water1 || 0) + (data.water2 || 0) + (data.water3 || 0);
        const percent = Math.round((total / 800) * 100);
        setWaterState(percent < 5 ? 'Empty' : 'Filled');
      })
      .catch(error => {
        console.error('Error fetching telemetry data:', error);
      });
  }, []);

  const handleWaterToggle = (relayNum: number) => {
    if (isAutoMode) return; // Prevent toggling in auto mode
    
    const newState = { ...relayState };
    newState[`relay${relayNum}` as keyof typeof newState] = 
      relayState[`relay${relayNum}` as keyof typeof relayState] ? 0 : 1;
    
    setRelayState(newState);
    axios.post('http://192.168.1.56/set-relays', newState)
      .then(response => {
        console.log('Watering successful:', response.data);
      })
      .catch(error => {
        console.error('Error watering:', error);
      });
  };

  const handleMedecine = (relayNum: number) => {
    if (isAutoMode) return; // Prevent toggling in auto mode
    
    const newState = { ...medRelayState };
    newState[`relay_med${relayNum}` as keyof typeof newState] = 
      medRelayState[`relay_med${relayNum}` as keyof typeof newState] ? 0 : 1;
    
    setMedRelayState(newState);
    axios.post('http://192.168.1.58/set-relays', newState)
      .then(response => {
        console.log('Medicine relay toggled:', response.data);
      })
      .catch(error => {
        console.error('Error toggling medicine relay:', error);
      });
  };

  return (
    <div className="relative p-4">
      <ToggleManualAutoMode 
        isAuto={isAutoMode} 
        onToggle={setIsAutoMode}
        className="fixed top-4 right-4 z-50"
      />
      
      <div className={`${isAutoMode ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-2">
            {/* Top Big Rectangle - Divided into 3 parts with icons above */}
            <div className="w-full max-w-2xl flex gap-2">
              {/* Feed Section */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-10 h-10 mb-1 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 10c.5.5 3.5 1 4.5 0 1-.5 1-2.5 0-3-.5-1-3.5-3-4.5-2-1 .5-1 3.5 0 5z"/>
                    <path d="M12 11l1 3c0 2-1 4-3 4s-3-2-3-4c0-1 0-3 1-4"/>
                    <path d="M18 10c1 1 2 3 1 5s-3 4-5 4-4.5-2-4.5-4c0-1.5 1-3 2-4"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Feed</span>
                <div className="w-full h-16 bg-white border-2 border-pink-200 shadow-sm rounded-lg flex items-center justify-center">
                  {/* Content can go here */}
                </div>
              </div>
              
              {/* Water Section */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-10 h-10 mb-1 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-xs font-medium text-gray-700">Water</span>
                <div className="w-full h-16 bg-white border-2 border-pink-200 shadow-sm rounded-lg flex items-center justify-center text-sm">
                  {`Water Level: ${waterState}`}
                </div>
              </div>
              
              {/* Medicine Section */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-10 h-10 mb-1 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-xs font-medium text-gray-700">Medicine</span>
                <div className="w-full h-16 bg-white border-2 border-pink-200 shadow-sm rounded-lg flex items-center justify-center">
                  {/* Content can go here */}
                </div>
              </div>
            </div>

            {/* Water & Medicine Sections */}
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {/* Water Section */}
              <div className="p-3 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Water</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      className={`aspect-square w-full flex items-center justify-center text-base font-semibold transition border-2 rounded-full ${
                        relayState[`relay${num}` as keyof typeof relayState] 
                          ? 'bg-green-200 border-green-500 text-green-900' 
                          : 'bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200'
                      }`}
                      onClick={() => handleWaterToggle(num)}
                      disabled={isAutoMode}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medicine Section */}
              <div className="p-3 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Medicine</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      className={`aspect-square w-full flex items-center justify-center text-base font-semibold transition border-2 rounded-full ${
                        medRelayState[`relay_med${num}` as keyof typeof medRelayState] 
                          ? 'bg-green-200 border-green-500 text-green-900' 
                          : 'bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200'
                      }`}
                      onClick={() => handleMedecine(num)}
                      disabled={isAutoMode}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stage Buttons */}
            <div className="w-full max-w-2xl grid grid-cols-3 gap-2 mt-2">
              {["Starter", "Grower", "Finisher"].map((label) => (
                <button
                  key={label}
                  className="py-2 text-xs sm:text-sm font-semibold text-green-700 transition bg-white border-2 border-pink-200 shadow-sm rounded-lg hover:bg-green-100 active:bg-green-200"
                  disabled={isAutoMode}
                >
                  {label}
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
import React, { useState } from 'react';
import ControlBody from '../components/ControlBody';
import { Fan, Lightbulb } from 'lucide-react';

const cages = ['Cage 1', 'Cage 2', 'Cage 3'];


function Environment() {
  const [activeCage, setActiveCage] = useState(0);
  // Each cage has its own fan and light state
  const [fanStates, setFanStates] = useState([false, false, false]);
  const [lightStates, setLightStates] = useState([false, false, false]);

  // Handlers for per-cage control
  const handleFan = (on: boolean) => {
    setFanStates((prev) => {
      const updated = [...prev];
      updated[activeCage] = on;
      return updated;
    });
  };
  const handleLight = (on: boolean) => {
    setLightStates((prev) => {
      const updated = [...prev];
      updated[activeCage] = on;
      return updated;
    });
  };

  return (
    <ControlBody>
      <div className="w-full max-w-6xl mx-auto pt-12 px-4 sm:px-8 md:px-16 min-h-screen pb-24">
        {/* Tabs */}
        <div className="flex flex-wrap space-x-4 sm:space-x-10 border-b-2 border-gray-300 mb-10 overflow-x-auto text-xl sm:text-2xl">
          {cages.map((cage, idx) => (
            <button
              key={cage}
              className={`pb-4 px-4 text-lg sm:text-2xl font-semibold focus:outline-none whitespace-nowrap ${activeCage === idx ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-700'}`}
              onClick={() => setActiveCage(idx)}
            >
              {cage}
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mb-10">
          <div className="rounded-3xl border-2 border-gray-200 bg-white flex flex-col items-center py-8 sm:py-12 shadow-md">
            <div className="text-blue-500 text-lg sm:text-2xl mb-2">Temperature</div>
            <div className="text-blue-600 text-4xl sm:text-5xl font-bold">26.1°C</div>
          </div>
          <div className="rounded-3xl border-2 border-gray-200 bg-white flex flex-col items-center py-8 sm:py-12 shadow-md">
            <div className="text-blue-600 text-4xl sm:text-5xl font-extrabold mb-2">GOOD</div>
            <div className="text-blue-500 text-lg sm:text-2xl">Air Quality</div>
          </div>
          <div className="rounded-3xl border-2 border-gray-200 bg-white flex flex-col items-center py-8 sm:py-12 shadow-md">
            <div className="text-blue-600 text-4xl sm:text-5xl font-extrabold mb-2">55%</div>
            <div className="text-blue-500 text-lg sm:text-2xl">Current Humidity</div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16">
          {/* Fan Control */}
          <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 sm:p-16 flex flex-col items-center shadow-md">
            <div className="flex items-center mb-6 sm:mb-8">
              <span className="text-blue-500 text-2xl sm:text-3xl font-bold mr-4">Fan</span>
              <Fan className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex space-x-8 sm:space-x-16 mt-4">
              <button
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full text-2xl sm:text-3xl font-extrabold ${!fanStates[activeCage] ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'} transition`}
                onClick={() => handleFan(false)}
              >
                Off
              </button>
              <button
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full text-2xl sm:text-3xl font-extrabold ${fanStates[activeCage] ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'} transition`}
                onClick={() => handleFan(true)}
              >
                On
              </button>
            </div>
          </div>
          {/* Light Control */}
          <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 sm:p-16 flex flex-col items-center shadow-md">
            <div className="flex items-center mb-6 sm:mb-8">
              <span className="text-blue-500 text-2xl sm:text-3xl font-bold mr-4">Lights</span>
              <Lightbulb className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex space-x-8 sm:space-x-16 mt-4">
              <button
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full text-2xl sm:text-3xl font-extrabold ${!lightStates[activeCage] ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'} transition`}
                onClick={() => handleLight(false)}
              >
                Off
              </button>
              <button
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full text-2xl sm:text-3xl font-extrabold ${lightStates[activeCage] ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'} transition`}
                onClick={() => handleLight(true)}
              >
                On
              </button>
            </div>
          </div>
        </div>
      </div>
    </ControlBody>
  );
}

export default Environment;
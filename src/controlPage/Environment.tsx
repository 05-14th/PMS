import React, { useState } from 'react';
import ControlBody from '../components/ControlBody';
import { Fan, Lightbulb } from 'lucide-react';

const cages = ['Cage 1', 'Cage 2', 'Cage 3'];

function Environment() {
  const [activeCage, setActiveCage] = useState(0);
  const [fanOn, setFanOn] = useState(false);
  const [lightOn, setLightOn] = useState(false);

  return (
    <ControlBody>
      <div className="w-full max-w-5xl mx-auto pt-6 px-2 sm:px-4 md:px-8 min-h-screen pb-16">
        {/* Tabs */}
        <div className="flex flex-wrap space-x-2 sm:space-x-6 border-b border-gray-200 mb-6 overflow-x-auto">
          {cages.map((cage, idx) => (
            <button
              key={cage}
              className={`pb-2 px-2 text-base sm:text-lg font-medium focus:outline-none whitespace-nowrap ${activeCage === idx ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'}`}
              onClick={() => setActiveCage(idx)}
            >
              {cage}
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white flex flex-col items-center py-4 sm:py-6 shadow-sm">
            <div className="text-blue-500 text-sm sm:text-base mb-1">Temperature</div>
            <div className="text-blue-600 text-2xl sm:text-3xl font-semibold">26.1°C</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white flex flex-col items-center py-4 sm:py-6 shadow-sm">
            <div className="text-blue-600 text-2xl sm:text-4xl font-bold mb-1">GOOD</div>
            <div className="text-blue-500 text-sm sm:text-base">Air Quality</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white flex flex-col items-center py-4 sm:py-6 shadow-sm">
            <div className="text-blue-600 text-2xl sm:text-4xl font-bold mb-1">55%</div>
            <div className="text-blue-500 text-sm sm:text-base">Current Humidity</div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          {/* Fan Control */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-8 flex flex-col items-center shadow-sm">
            <div className="flex items-center mb-3 sm:mb-4">
              <span className="text-blue-500 text-base sm:text-lg font-medium mr-2">Fan</span>
              <Fan className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex space-x-4 sm:space-x-8 mt-2">
              <button
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full text-lg sm:text-xl font-bold ${!fanOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'} transition`}
                onClick={() => setFanOn(false)}
              >
                Off
              </button>
              <button
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full text-lg sm:text-xl font-bold ${fanOn ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'} transition`}
                onClick={() => setFanOn(true)}
              >
                On
              </button>
            </div>
          </div>
          {/* Light Control */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-8 flex flex-col items-center shadow-sm">
            <div className="flex items-center mb-3 sm:mb-4">
              <span className="text-blue-500 text-base sm:text-lg font-medium mr-2">Lights</span>
              <Lightbulb className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex space-x-4 sm:space-x-8 mt-2">
              <button
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full text-lg sm:text-xl font-bold ${!lightOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'} transition`}
                onClick={() => setLightOn(false)}
              >
                Off
              </button>
              <button
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full text-lg sm:text-xl font-bold ${lightOn ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'} transition`}
                onClick={() => setLightOn(true)}
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
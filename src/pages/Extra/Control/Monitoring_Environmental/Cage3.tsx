import React from 'react';
import { Wind, Thermometer, Droplet } from "lucide-react";

interface CageProps {
  isAutoMode: boolean;
}

const Cage3: React.FC<CageProps> = ({ isAutoMode }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
     
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Air Quality */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center gap-2 mb-3 h-8">
            <Wind className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="font-semibold text-green-700 text-lg whitespace-nowrap">Air Quality</span>
          </div>
          <div className="flex-1 p-4 bg-white border-2 border-green-200 shadow-sm rounded-xl">
            <div className="h-32 bg-green-50 rounded flex items-center justify-center text-green-400">
              Air quality monitoring content
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center gap-2 mb-3 h-8">
            <Thermometer className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="font-semibold text-green-700 text-lg whitespace-nowrap">Temperature</span>
          </div>
          <div className="flex-1 p-4 bg-white border-2 border-green-200 shadow-sm rounded-xl">
            <div className="h-32 bg-green-50 rounded flex items-center justify-center text-green-400">
              Temperature monitoring content
            </div>
          </div>
        </div>

        {/* Current Humidity */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center gap-2 mb-3 h-8">
            <Droplet className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="font-semibold text-green-700 text-lg whitespace-nowrap">Current Humidity</span>
          </div>
          <div className="flex-1 p-4 bg-white border-2 border-green-200 shadow-sm rounded-xl">
            <div className="h-32 bg-green-50 rounded flex items-center justify-center text-green-400">
              Humidity monitoring content
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cage3;
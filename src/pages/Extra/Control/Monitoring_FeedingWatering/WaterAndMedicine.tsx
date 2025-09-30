import React from 'react';
import { Droplets, Pill } from "lucide-react";

const WaterAndMedicine: React.FC = () => {
  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Water Section */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Water</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400">
              Water monitoring content
            </div>
          </div>
        </div>

        {/* Medicine Section */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Pill className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Medicine</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400">
              Medicine monitoring content
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterAndMedicine;

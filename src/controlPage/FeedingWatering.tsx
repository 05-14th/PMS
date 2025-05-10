import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Developing from '../components/Developing'
import ControlBody from '../components/ControlBody'

function FeedingWatering() {
  const [waterLevel, setWaterLevel] = useState(100);
  const [foodLevel, setFoodLevel] = useState(100);

  const handleReleaseWater = () => {
    setWaterLevel((prev) => Math.max(prev - 30, 0));
  };

  const handleRefillWater = () => {
    setWaterLevel(100);
  };

  const handleReleaseFood = () => {
    setFoodLevel((prev) => Math.max(prev - 30, 0));
  };

  const handleRefillFood = () => {
    setFoodLevel(100);
  };

  return (
    <div className="min-h-screen bg-white pt-0">
      <ControlBody>
        <div className="w-full flex flex-col sm:flex-row items-center sm:justify-center gap-8 px-4 mt-10">
          
          {/* Water Section */}
          <div className="flex flex-col items-center gap-4 sm:w-1/3 w-full">
            <h1 className="text-2xl font-semibold text-gray-200 mt-6">Water Level</h1>
            <div
              className="relative w-48 h-72 border-4 border-gray-200 rounded-md overflow-hidden cursor-pointer"
              onClick={handleReleaseWater}
            >
              <div
                className="absolute bottom-0 w-full bg-blue-400 transition-all duration-700 ease-in-out"
                style={{ height: `${waterLevel}%`, borderTopLeftRadius: "40% 20%", borderTopRightRadius: "40% 20%" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold text-center pointer-events-none">
                Tap Me <br /> to Release
              </div>
            </div>
            <button
              onClick={handleRefillWater}
              className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition"
            >
              Refill Water
            </button>
          </div>

          {/* Food Section */}
          <div className="flex flex-col items-center gap-4 sm:w-1/3 w-full">
            <h1 className="text-2xl font-semibold text-gray-200 mt-6">Food Level</h1>
            <div
              className="relative w-48 h-72 border-4 border-gray-200 rounded-md overflow-hidden cursor-pointer"
              onClick={handleReleaseFood}
            >
              <div
                className="absolute bottom-0 w-full bg-orange-400 transition-all duration-700 ease-in-out"
                style={{ height: `${foodLevel}%`, borderTopLeftRadius: "40% 20%", borderTopRightRadius: "40% 20%" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold text-center pointer-events-none">
                Tap Me <br /> to Release
              </div>
            </div>
            <button
              onClick={handleRefillFood}
              className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition"
            >
              Refill Food
            </button>
          </div>

        </div>
      </ControlBody>
    </div>
  );
}

export default FeedingWatering;
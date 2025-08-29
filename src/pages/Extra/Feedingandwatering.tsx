import React from "react";
import { Droplets, Pill } from "lucide-react";

const Feedingandwatering: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex flex-col items-center gap-4">
        {/* Top Big Rectangle */}
        <div className="w-full max-w-2xl h-32 sm:h-40 bg-white border-2 border-pink-200 shadow-sm rounded-xl" />

        {/* Water & Medicine Sections */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Water Section */}
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Droplets className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700">Water</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  className="aspect-square w-full flex items-center justify-center text-lg font-semibold text-green-700 transition border-2 border-pink-200 rounded-full hover:bg-green-100 active:bg-green-200"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Medicine Section */}
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700">Medicine</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  className="aspect-square w-full flex items-center justify-center text-lg font-semibold text-green-700 transition border-2 border-pink-200 rounded-full hover:bg-green-100 active:bg-green-200"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Buttons */}
        <div className="w-full max-w-2xl grid grid-cols-3 gap-3">
          {["Starter", "Grower", "Finisher"].map((label) => (
            <button
              key={label}
              className="py-3 text-sm sm:text-base font-semibold text-green-700 transition bg-white border-2 border-pink-200 shadow-sm rounded-lg hover:bg-green-100 active:bg-green-200"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feedingandwatering;
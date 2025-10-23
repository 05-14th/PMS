import React from "react";
import { Utensils } from "lucide-react";

interface FeedingProps {
  batchID: number | undefined;
}

const Feeding: React.FC<FeedingProps> = ({ batchID }) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feed Section 1 */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">
              Starter
            </span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 h-32 flex items-center justify-center text-gray-400">
              Feed monitoring content 1
            </div>
          </div>
        </div>

        {/* Feed Section 2 */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Grower</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 h-32 flex items-center justify-center text-gray-400">
              Feed monitoring content 2
            </div>
          </div>
        </div>

        {/* Feed Section 3 */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">
              Finisher
            </span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 h-32 flex items-center justify-center text-gray-400">
              Feed monitoring content 3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feeding;

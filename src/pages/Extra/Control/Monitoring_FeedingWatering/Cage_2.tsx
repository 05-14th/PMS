import React from 'react';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

const Cage_2: React.FC = () => {
  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-bold text-green-800 mb-6">Cage 2 Monitoring</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feed Container */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <RestaurantIcon className="text-green-600 mr-2" fontSize="large" />
            <h3 className="text-lg font-semibold text-gray-800">Feed</h3>
          </div>
          <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400">
            Feed monitoring content will appear here
          </div>
        </div>

        {/* Water Container */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <LocalDrinkIcon className="text-green-600 mr-2" fontSize="large" />
            <h3 className="text-lg font-semibold text-gray-800">Water</h3>
          </div>
          <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400">
            Water monitoring content will appear here
          </div>
        </div>

        {/* Med Container */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <MedicalServicesIcon className="text-green-600 mr-2" fontSize="large" />
            <h3 className="text-lg font-semibold text-gray-800">Med</h3>
          </div>
          <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400">
            Medication monitoring content will appear here
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cage_2;
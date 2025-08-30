import { useState } from 'react';
import Developing from '../components/Developing';
import MainBody from '../components/MainBody';
import ConnectModal from '../components/ConnectModal';  // Import the ConnectModal
import LineChart from '../charts/LineChart';
import PieChart from '../charts/PieChart';

function HomePage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const labels = ['January', 'February', 'March', 'April'];
  const dataPoints = [65, 59, 80, 81];
  const plabels = ['Red', 'Blue', 'Yellow', 'Green'];
  const pDataPoints = [30, 25, 20, 25];

  return (
    <MainBody>
      {/* Content Area */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-10 pb-10 bg-white">
      

        {/* Graph-like Placeholders */}
        <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          {/* Line Graph Placeholder - now appears first */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow">
            <h2 className="text-gray-700 font-semibold mb-4">Line Graph</h2>
            <LineChart labels={labels} dataPoints={dataPoints} />
          </div>

          {/* Pie Chart Placeholder - now appears second */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow">
            <h2 className="text-gray-700 font-semibold mb-4">Pie Chart</h2>
            <PieChart labels={plabels} dataPoints={pDataPoints} />
          </div>
        </div>
      </div>

      {/* Sticky Connect Button */}
      <div className="bg-gray-300 py-7 px-4 flex flex-col items-center justify-center shadow-inner">
        <h2 className="text-gray-100 text-center text-lg md:text-xl mb-3">
          Connect your device via WiFi and click ‘Connect’ to get started!
        </h2>

        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-10 rounded-lg flex items-center gap-2 text-base shadow"
        >
          Connect Device
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 0c2.5 2.5 2.5 13.5 0 16m0-16c-2.5 2.5-2.5 13.5 0 16M3.6 9h16.8M3.6 15h16.8"
            />
          </svg>
        </button>
      </div>

    
      {/* Connect Modal */}
      {isConnectModalOpen && (
        <ConnectModal
          onClose={() => setIsConnectModalOpen(false)}
          isOpen={isConnectModalOpen}
        />
      )}
    </MainBody>
  );
}

export default HomePage;
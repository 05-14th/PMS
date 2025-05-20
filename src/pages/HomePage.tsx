import { useState } from 'react';
import Developing from '../components/Developing';
import MainBody from '../components/MainBody';
import ConnectModal from '../components/ConnectModal';  // Import the ConnectModal

function HomePage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  return (
    <MainBody>
      {/* Content Area */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-10 pb-10 bg-white">
        <h1 className="text-xl font-semibold mb-4 text-gray-800">
          Home page is under development
        </h1>

        {/* Graph-like Placeholders */}
        <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          {/* Bar Graph Placeholder */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow">
            <h2 className="text-gray-700 font-semibold mb-4">Bar Graph</h2>
            <div className="flex items-end gap-2 h-48">
              {[40, 60, 80, 50, 30, 70].map((height, i) => (
                <div
                  key={i}
                  className="w-8 bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
          
            </div>
          </div>

          {/* Line Graph Placeholder */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow">
            <h2 className="text-gray-700 font-semibold mb-4">Line Graph</h2>
            <div className="relative h-48 w-full">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points="0,80 20,60 40,65 60,45 80,50 100,30"
                />
                <circle cx="0" cy="80" r="2" fill="#10b981" />
                <circle cx="20" cy="60" r="2" fill="#10b981" />
                <circle cx="40" cy="65" r="2" fill="#10b981" />
                <circle cx="60" cy="45" r="2" fill="#10b981" />
                <circle cx="80" cy="50" r="2" fill="#10b981" />
                <circle cx="100" cy="30" r="2" fill="#10b981" />
              </svg>
              <div className="absolute bottom-0 w-full flex justify-between text-sm text-gray-500 px-2">
           
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Connect Button */}
      <div className="sticky bottom-0 w-full bg-gray-300 py-15 px-4 flex flex-col items-center justify-center shadow-inner">
        <h2 className="text-white text-center text-lg md:text-xl mb-3">
          Connect your device via WiFi and click ‘Connect’ to get started!
        </h2>

        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-10 rounded-lg flex items-center gap-2 text-base shadow"
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
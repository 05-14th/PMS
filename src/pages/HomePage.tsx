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
  {/* Line Graph Placeholder - now appears first */}
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
        {[0, 20, 40, 60, 80, 100].map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={[80, 60, 65, 45, 50, 30][i]}
            r="2"
            fill="#10b981"
          />
        ))}
      </svg>
    </div>
  </div>

  {/* Pie Chart Placeholder - now appears second */}
  <div className="bg-white border border-gray-300 rounded-lg p-4 shadow">
    <h2 className="text-gray-700 font-semibold mb-4">Pie Chart</h2>
    <svg viewBox="0 0 32 32" className="w-full h-48">
      <circle r="16" cx="16" cy="16" fill="#ef4444" />
      <path
        d="M16 16 L32 16 A16 16 0 0 1 16 32 Z"
        fill="#3b82f6"
      />
      <path
        d="M16 16 L16 32 A16 16 0 0 1 0 16 Z"
        fill="#f59e0b"
      />
      <path
        d="M16 16 L0 16 A16 16 0 0 1 16 0 Z"
        fill="#10b981"
      />
    </svg>
  </div>
</div>
      </div>

      {/* Sticky Connect Button */}
      <div className="bg-gray-300 py-7 px-4 flex flex-col items-center justify-center shadow-inner">
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

      {/* Web Info / About Section */}
<div className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-200 py-10 px-6 md:px-20 border-t border-gray-700 shadow-inner">
  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center text-gray-400 tracking-wide">
    About This Platform
  </h2>
  <p className="text-base md:text-lg leading-relaxed text-center max-w-4xl mx-auto mb-6">
    Empowering users with seamless device connectivity, insightful data visualization, and intuitive controls.
    This system is designed to adapt to your needs in real-time, bringing innovation to your fingertips.
  </p>
  <div className="flex flex-col md:flex-row justify-center gap-8 mt-8 text-sm text-gray-400">
    <div className="flex-1 text-center md:text-left">
      <h3 className="text-gray-300 font-semibold mb-2">Mission</h3>
      <p>To provide intelligent, real-time device interaction that improves productivity and user experience.</p>
    </div>
    <div className="flex-1 text-center md:text-left">
      <h3 className="text-gray-300 font-semibold mb-2">Vision</h3>
      <p>To become the go-to platform for integrated device monitoring and smart connectivity solutions.</p>
    </div>
  </div>
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
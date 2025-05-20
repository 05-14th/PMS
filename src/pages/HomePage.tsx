import { useState } from 'react';
import Developing from '../components/Developing';
import MainBody from '../components/MainBody';
import ConnectModal from '../components/ConnectModal';  // Import the ConnectModal

function HomePage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  return (
    <MainBody>
      {/* Content Area with GIF */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-10 pb-32 bg-white">
        <h1 className="text-xl font-semibold mb-4 text-gray-800">
          Home page is under development
        </h1>
        <Developing />
      </div>

      {/* Bottom Overlay */}
      <div className="bottom-9 left-0 w-full bg-gray-300 py-6 px-4 flex flex-col items-center justify-center shadow-inner">
        <h2 className="text-white text-center text-lg md:text-xl mb-3">
          Connect your device via WiFi and click ‘Connect’ to get started!
        </h2>

        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-5 rounded-lg flex items-center gap-2 text-base shadow"
        >
          Connect Device
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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

      {/* Conditionally render the ConnectModal */}
      {isConnectModalOpen && (
        <ConnectModal
          onClose={() => setIsConnectModalOpen(false)} // Pass onClose prop to handle modal close
          isOpen={isConnectModalOpen} // Pass dynamic isOpen prop
        />
      )}
    </MainBody>
  );
}

export default HomePage;

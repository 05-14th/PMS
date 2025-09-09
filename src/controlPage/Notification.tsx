import { useState } from 'react';
import ControlBody from '../components/ControlBody';

function Notification() {
  const [notificationList] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] w-full">
      <ControlBody>
        <div className="flex items-center justify-center w-full h-full p-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="currentColor" 
                viewBox="0 0 24 24" 
                className="w-8 h-8 text-yellow-500"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9v4.28c0 .53-.21 1.04-.59 1.41l-1.3 1.3A1 1 0 005 18h14a1 1 0 00.89-1.45l-1.3-1.3a2 2 0 01-.59-1.41V9c0-3.87-3.13-7-7-7zm0 20a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22z" />
              </svg>
              {notificationList.length > 0 && (
                <span className="absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-700">Notifications</h2>
          </div>
        </div>
      </ControlBody>
    </div>
  );
}

export default Notification;

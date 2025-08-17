import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Developing from '../components/Developing'
import ControlBody from '../components/ControlBody'


function Notification() {
  const [notificationList, setNotificationList] = useState([
    "System update completed successfully.",
    "New user registered: John Doe.",
    "Backup was created at 2:00 AM."
  ]);

  const handleDelete = (indexToDelete: number) => {
    setNotificationList((prevList) =>
      prevList.filter((_, index) => index !== indexToDelete)
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex justify-center items-center">
      <ControlBody>
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center tracking-wide flex items-center justify-center gap-2">
            <span className="relative flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7 text-orange-500">
                <path d="M12 2C8.13 2 5 5.13 5 9v4.28c0 .53-.21 1.04-.59 1.41l-1.3 1.3A1 1 0 005 18h14a1 1 0 00.89-1.45l-1.3-1.3a2 2 0 01-.59-1.41V9c0-3.87-3.13-7-7-7zm0 20a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22z" />
              </svg>
              <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </span>
            Notifications
          </h2>
          {notificationList.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No notifications.</div>
          ) : (
            notificationList.map((notification, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-4 flex justify-between items-center min-w-[320px] transition hover:shadow-xl hover:border-blue-300 notification-blur"
              >
                <span className="text-gray-700 font-medium tracking-wide flex items-center gap-2">
                  <span className="relative flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-orange-500">
                      <path d="M12 2C8.13 2 5 5.13 5 9v4.28c0 .53-.21 1.04-.59 1.41l-1.3 1.3A1 1 0 005 18h14a1 1 0 00.89-1.45l-1.3-1.3a2 2 0 01-.59-1.41V9c0-3.87-3.13-7-7-7zm0 20a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22z" />
                    </svg>
                    <span className="absolute top-0 right-0 block w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                  </span>
                  {notification}
                </span>
                <button
                  onClick={() => handleDelete(index)}
                  className="ml-4 text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  aria-label="Dismiss notification"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </ControlBody>
    </div>
  );
}

export default Notification;

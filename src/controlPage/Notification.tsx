import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Developing from '../components/Developing'
import ControlBody from '../components/ControlBody'

function Notification() {
  const [notificationList, setNotificationList] = useState(["Pogi ako", "Gwapo ako", "GG Capstone"])

  const handleDelete = (indexToDelete) => {
    setNotificationList((prevList) =>
      prevList.filter((_, index) => index !== indexToDelete)
    );
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center">
      <ControlBody>
        <div className="flex flex-col gap-2 p-4">
          {notificationList.map((notification, index) => (
            <div
              key={index}
              className="bg-gray-800 text-white px-6 py-3 rounded-full border-2 border-white shadow-md hover:bg-gray-700 transition duration-300 flex justify-between items-center min-w-[300px]"
            >
              <span>{notification}</span>
              <button
                onClick={() => handleDelete(index)}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-3 py-1 text-sm ml-4"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </ControlBody>
    </div>
  )
}

export default Notification;

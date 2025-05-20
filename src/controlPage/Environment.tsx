import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Developing from '../components/Developing'
import ControlBody from '../components/ControlBody'
import { useEffect } from 'react';

function Environment() {
  const [activeTab, setActiveTab] = useState('Temperature');
  const tabs = ['Temperature', 'Humidity', 'Light', 'Air Quality'];
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });



  const renderTabContent = () => {
    const cardBase = "bg-white rounded-xl shadow p-4 text-gray-800"; 
    const progressBg = "bg-gray-200 h-2 rounded-full"; 
    const progressFg = "bg-orange-500 h-2 rounded-full";

    switch (activeTab) {
      case 'Temperature':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${cardBase} flex flex-col items-center`}>
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-xl font-bold text-orange-700">
                26.1°C
              </div>
              <p className="mt-2 text-gray-700">Target Temperature</p>
              <div className="w-full mt-4">
                <p className="text-sm text-gray-600">Set Point</p>
                <div className={progressBg}>
                  <div className={`${progressFg} w-1/2`}></div>
                </div>
              </div>
            </div>
            <div className={cardBase}>
              <div className="w-full h-24 bg-orange-100 rounded mb-4"></div>
              <p className="text-gray-700 text-sm mb-1">Automation</p>
              <div className={progressBg}>
                <div className={`${progressFg} w-2/3`}></div>
              </div>
              <p className="text-sm text-gray-700 mt-2">5AM – 8PM</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700">Status</span>
                <span className="text-orange-400 font-semibold">ON</span>
              </div>
            </div>
            <div className={`${cardBase} flex flex-col items-center justify-center`}>
              <div className="text-3xl font-bold text-orange-400">18</div>
              <p className="text-orange-300 font-medium">GOOD</p>
              <div className="w-full mt-4 flex justify-between items-center">
                <span className="text-gray-700 text-sm">Automation</span>
                <div className="w-10 h-5 bg-orange-400 rounded-full flex items-center justify-end p-1">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Humidity':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardBase} flex flex-col items-center`}>
              <div className="text-2xl font-semibold text-orange-400">55%</div>
              <p className="text-gray-700">Current Humidity</p>
            </div>
            <div className={cardBase}>
              <p className="text-gray-700 mb-2">Automation</p>
              <div className="w-10 h-5 bg-orange-400 rounded-full flex items-center justify-end p-1">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        );
      case 'Light':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cardBase}>
              <div className="w-full h-24 bg-orange-100 rounded"></div>
              <p className="mt-2 text-center text-gray-700">Lighting Graph</p>
            </div>
            <div className={`${cardBase} flex justify-between items-center`}>
              <p className="text-gray-700">Automation</p>
              <div className="w-10 h-5 bg-orange-400 rounded-full flex items-center justify-end p-1">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        );
      case 'Air Quality':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardBase} flex flex-col items-center`}>
              <div className="text-3xl font-bold text-orange-400">18</div>
              <p className="text-orange-300 font-medium">Good</p>
            </div>
            <div className={`${cardBase} flex justify-between items-center`}>
              <p className="text-gray-700">Automation</p>
              <div className="w-10 h-5 bg-orange-400 rounded-full flex items-center justify-end p-1">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ControlBody>
        <div className="p-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4">Environmental Control</h1>

          {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-gray-200 font-medium transition ${
                  activeTab === tab ? 'bg-orange-600' : 'bg-orange-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            {renderTabContent()}
          </div>
        </div>
      </ControlBody>

     
      
    
    </div>
  );
}

export default Environment;

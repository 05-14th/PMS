import React, { useState, useRef, useEffect } from "react";
import ControlBody from "../components/ControlBody";
import Feedingandwatering from "./Extra/Control/Feedingandwatering";
import GuideModal from "./Extra/Control/GuideModal";

const SubTabsPage: React.FC<{ onShowGuide: () => void }> = ({ onShowGuide }) => {
  const [activeTab, setActiveTab] = useState("feeding");
  const tabContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-2xl mt-16" ref={tabContainerRef}>
      {/* Sub Tabs */}
      <div className="flex mb-4 border-b">
        <button
          className={`flex-1 py-2 px-4 text-center font-medium ${
            activeTab === "feeding"
              ? "border-b-4 border-green-500 text-green-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("feeding")}
        >
          Feeding and Watering
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center font-medium ${
            activeTab === "environmental"
              ? "border-b-4 border-green-500 text-green-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("environmental")}
        >
          Environmental
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "feeding" && (
          <div>
            <Feedingandwatering />
          </div>
        )}

        {activeTab === "environmental" && (
          <div>
            <h2 className="mb-2 text-xl font-semibold">Environmental</h2>
            <p className="text-gray-700">
              Monitor and control temperature, humidity, and air quality.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function Control() {
  const [showGuide, setShowGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showGuide && tabContainerRef.current) {
      const rect = tabContainerRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  }, [showGuide]);

  return (
    <div className={`min-h-screen bg-black ${showGuide ? 'overflow-hidden' : ''}`}>
      <ControlBody className="relative">
        <div className="w-full px-4 flex flex-col md:flex-row justify-between relative">
          {/* Main content */}
          <div className="flex-1" ref={tabContainerRef}>
            <SubTabsPage onShowGuide={() => setShowGuide(true)} />
            
            {showGuide && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                  className="absolute inset-0 bg-black/30 backdrop-blur-lg"
                  onClick={() => setShowGuide(false)}
                ></div>
                <div className="relative w-full max-w-2xl z-10" style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '90%',
                  maxWidth: '42rem'
                }}>
                  <GuideModal onClose={() => setShowGuide(false)} />
                </div>
              </div>
            )}
          </div>
          
          {/* Three Icon Containers - Sidebar */}
          <div className="hidden md:flex flex-col space-y-4 w-64 ml-8 sticky top-24 h-0">
            {/* Water Container */}
            <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-800">Water Level</h3>
                <p className="text-xs text-gray-500">Monitor water supply</p>
              </div>
            </div>

            {/* Medicine Container */}
            <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-800">Medicine</h3>
                <p className="text-xs text-gray-500">Manage distribution</p>
              </div>
            </div>

            {/* Feed Supply Container */}
            <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-800">Feed Supply</h3>
                <p className="text-xs text-gray-500">Check feed levels</p>
              </div>
            </div>
          </div>

          {/* Mrs. Chick help section - Desktop only */}
          {!isMobile && (
            <div className="ml-8 flex flex-col items-center sticky top-24 mt-12">
              <img 
                src="/Extras/Mr_Chick.png" 
                alt="Mr. Chick" 
                className="w-64 h-64 object-contain mb-4"
              />
              <div className="text-center mt-8">
                <p className="text-green-800 font-semibold text-xl mb-2">I'm Mrs. Chick your mate!</p>
                <p className="text-lg text-green-700 mb-8">Need some help?
                  Click " Guide me "</p>
                <button 
                  className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-10 rounded-full transition-all duration-200 text-lg transform hover:scale-105 mt-4"
                  onClick={() => setShowGuide(true)}
                >
                  Guide me
                </button>
              </div>
            </div>
          )}

          {/* Mobile floating guide button */}
          {isMobile && (
            <button 
              onClick={() => setShowGuide(true)}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-40 hover:bg-green-800 transition-colors"
              aria-label="Open guide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </ControlBody>
    </div>
  );
}

export default Control;
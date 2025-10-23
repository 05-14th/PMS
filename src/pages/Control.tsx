import React, { useState, useRef, useEffect } from "react";
import ControlBody from "../components/ControlBody";
import Feedingandwatering from "./Extra/Control/Feedingandwatering";
import Environmental from "./Extra/Control/Environmental";
import GuideModal from "./Extra/Control/GuideModal";
import axios from "axios";

interface ActiveBatch {
  batchID: number;
  batchName: string;
}

const SubTabsPage: React.FC<{ onShowGuide: () => void }> = ({
  onShowGuide,
}) => {
  const [activeTab, setActiveTab] = useState("feeding");
  const [activeBatches, setActiveBatches] = useState<ActiveBatch[]>([]); // NEW STATE for fetched batches
  const [selectedBatchID, setSelectedBatchID] = useState<number | undefined>(
    undefined
  ); // Use ID for selection
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const api = axios.create({ baseURL: import.meta.env.VITE_APP_SERVERHOST }); // Set up axios instance

  // NEW: Fetch active batches on component mount
  useEffect(() => {
    const fetchActiveBatches = async () => {
      try {
        const response = await api.get("/api/batches/active");
        const batches: ActiveBatch[] = response.data;
        setActiveBatches(batches);

        if (batches.length > 0) {
          setSelectedBatchID(batches[0].batchID);
        }
      } catch (error) {
        console.error("Failed to fetch active batches:", error);
      }
    };
    fetchActiveBatches();
  }, []);

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value, 10);
    setSelectedBatchID(id);
    console.log("Selected Batch ID:", id);
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-2xl mt-16"
      ref={tabContainerRef}
    >
      {/* Batch No Combo Box */}
      <div className="mb-6">
        <label
          htmlFor="batch"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Batch No
        </label>
        <select
          id="batch"
          // Use the ID for value
          value={selectedBatchID === undefined ? "" : selectedBatchID}
          onChange={handleBatchChange}
          className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {activeBatches.length === 0 && (
            <option value="" disabled>
              No active batches available
            </option>
          )}
          {activeBatches.map((batch) => (
            <option key={batch.batchID} value={batch.batchID}>
              {batch.batchName}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Sub Tabs */}
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
        {/* Pass the selected Batch ID down to the child components */}
        {activeTab === "feeding" && (
          <Feedingandwatering batchID={selectedBatchID} />
        )}
        {activeTab === "environmental" && (
          <Environmental batchID={selectedBatchID} />
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (showGuide && tabContainerRef.current) {
      const rect = tabContainerRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [showGuide]);

  return (
    <div
      className={`min-h-screen bg-black ${showGuide ? "overflow-hidden" : ""}`}
    >
      <ControlBody className="relative">
        <div className="w-full px-4 flex flex-col lg:flex-row justify-between relative">
          {/* Main content */}
          <div className="flex-1" ref={tabContainerRef}>
            <SubTabsPage onShowGuide={() => setShowGuide(true)} />

            {showGuide && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/30 backdrop-blur-lg"
                  onClick={() => setShowGuide(false)}
                ></div>
                <div
                  className="relative w-full max-w-2xl z-10"
                  style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "90%",
                    maxWidth: "42rem",
                  }}
                >
                  <GuideModal onClose={() => setShowGuide(false)} />
                </div>
              </div>
            )}
          </div>

          {/* ✅ Right sidebar - Desktop only */}
          <div className="hidden lg:flex flex-col w-80 ml-12 mt-40 space-y-8">
            <div className="space-y-4">
              {/* Water Container */}
              <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-800">
                    Water Level
                  </h3>
                  <p className="text-xs text-gray-500">Monitor water supply</p>
                </div>
              </div>

              {/* Medicine Container */}
              <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-800">
                    Medicine
                  </h3>
                  <p className="text-xs text-gray-500">Manage distribution</p>
                </div>
              </div>

              {/* Feed Supply Container */}
              <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-800">
                    Feed Supply
                  </h3>
                  <p className="text-xs text-gray-500">Check feed levels</p>
                </div>
              </div>
            </div>

            {/* ✅ Mrs. Chick Help */}
            <div className="flex flex-col items-center mt-4">
              <img
                src="/Extras/Mr_Chick.png"
                alt="Mr. Chick"
                className="w-48 h-48 object-contain"
              />
              <div className="text-center mt-4">
                <p className="text-green-800 font-semibold text-lg mb-2">
                  I'm Mrs. Chick your mate!
                </p>
                <p className="text-md text-green-700 mb-4">
                  Need some help?
                  <br />
                  Click "Guide me"
                </p>
                <button
                  className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-6 rounded-full transition-all duration-200 text-md transform hover:scale-105"
                  onClick={() => setShowGuide(true)}
                >
                  Guide me
                </button>
              </div>
            </div>
          </div>

          {/* ✅ Mobile floating guide button */}
          {isMobile && (
            <button
              onClick={() => setShowGuide(true)}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-40 hover:bg-green-800 transition-colors"
              aria-label="Open guide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </ControlBody>
    </div>
  );
}

export default Control;

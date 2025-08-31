import React, { useState } from "react";
import ControlBody from "../components/ControlBody";
import Feedingandwatering from "./Extra/Control/Feedingandwatering";


const SubTabsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("feeding");

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-2xl mt-16">
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
  return (
    <div className="min-h-screen bg-black">
      <ControlBody>
        <div className="w-full px-4">
          {/* Sub Tabs inside ControlBody */}
          <SubTabsPage />

          {/* Keep Developing if needed */}
          {/* <Developing /> */}
        </div>
      </ControlBody>
    </div>
  );
}

export default Control;
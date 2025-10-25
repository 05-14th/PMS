import React, { useState } from "react";
import { FaLightbulb, FaPills } from "react-icons/fa";
import Light_Form from "./Auto_Forms/Light_Form";
import Medicine_Form from "./Auto_Forms/Medicine_Form";

const Automation_Form: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [showLightForm, setShowLightForm] = useState(false);
  const [showMedicineForm, setShowMedicineForm] = useState(false);

  const handleLightSave = (startTime: string, endTime: string) => {
    console.log('Light schedule saved:', { startTime, endTime });
    // Here you can add the logic to save the schedule
  };

  const handleMedicineSave = (dates: Date[]) => {
    console.log('Medicine schedule saved for dates:', dates);
    // Here you can add the logic to save the medicine schedule
    setShowMedicineForm(false);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowLightForm(true)}
          className="flex flex-col items-center justify-center p-6 rounded-lg shadow-md transition-all duration-300 bg-white hover:bg-green-50 border border-gray-200"
        >
          <FaLightbulb className="text-4xl text-green-600 mb-2" />
          <span className="text-lg font-medium text-gray-800">Light</span>
        </button>

        <button
          onClick={() => setShowMedicineForm(true)}
          className="flex flex-col items-center justify-center p-6 rounded-lg shadow-md transition-all duration-300 bg-white hover:bg-green-50 border border-gray-200"
        >
          <FaPills className="text-4xl text-green-600 mb-2" />
          <span className="text-lg font-medium text-gray-800">Medicine</span>
        </button>
      </div>

      {showLightForm && (
        <Light_Form
          onClose={() => setShowLightForm(false)}
          onSave={handleLightSave}
        />
      )}

      {showMedicineForm && (
        <Medicine_Form
          onClose={() => setShowMedicineForm(false)}
          onSave={handleMedicineSave}
        />
      )}
    </div>
  );
};

export default Automation_Form;

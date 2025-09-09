import React, { useState } from 'react';

interface GuideModalProps {
  onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2;
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else {
      onClose();
    }
  };
  
  const handleBack = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md"></div>
      <div className="relative bg-white/95 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl transform -translate-y-1/2 top-1/2 border border-white/10">
        <div className="text-green-700 mt-2">
          {currentPage === 1 && (
            <div>
              <h3 className="font-semibold mb-3">Feeding and Watering</h3>
              <p className="mb-4">There are specific containers, as you can see.</p>
              <p className="mb-4">
                A medicine and water container with buttons for specific cages vary according to cage level, 
                and feeding buttons are located below. Grower, Finisher, and Starter.
              </p>
              <p>
                Additionally, the monitoring display above indicates that it is full and empty for feeding and watering.
              </p>
            </div>
          )}
          
          {currentPage === 2 && (
            <div>
              <h3 className="font-semibold mb-3">Environmental Control</h3>
              <p className="mb-4">
                Every cage has a fan control and a light control for the specified cage level in environmental control.
              </p>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
            >
              Back
            </button>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
            >
              {currentPage === totalPages ? (
                <>
                  <span className="mr-1">✓</span> Done
                </>
              ) : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
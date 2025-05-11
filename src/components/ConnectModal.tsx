import React, { useEffect, useState } from "react";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState("Connecting");

  useEffect(() => {
    if (isOpen) {
      setStatus("Connecting");
      const timer = setTimeout(() => {
        setStatus("Connected");
      }, 3000); // simulate 3-second pairing
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50">
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center justify-center w-80 h-80">
        <img src="/Extras/Rectangle 58.png" alt="Wi-Fi" className="w-20 h-20 mb-4 animate-pulse" />
        <p className="text-orange-500 font-bold text-xl">
          {status}
          {status === "Connecting" && <span className="animate-ping ml-1 text-orange-400">.</span>}
        </p>
        {status === "Connected" && (
          <button
            onClick={onClose}
            className="mt-6 bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-500"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectModal;

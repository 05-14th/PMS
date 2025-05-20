import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const TargetModal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (location.state?.openModal) {
      setIsOpen(true);
    }
  }, [location.state]);

  const handleClose = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Target Page</h1>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 relative">
            <h2 className="text-xl font-bold mb-4">Modal Title</h2>
            <p>This modal opened automatically on navigation.</p>
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetModal;

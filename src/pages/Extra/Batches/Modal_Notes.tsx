import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ModalNotesProps {
  isOpen: boolean;
  onClose: () => void;
  note: string;
  title?: string;
}

const ModalNotes: React.FC<ModalNotesProps> = ({ 
  isOpen, 
  onClose, 
  note, 
  title = 'Note Details' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    document.body.style.overflow = 'unset';
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {note ? (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{note}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">No notes available</p>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalNotes;
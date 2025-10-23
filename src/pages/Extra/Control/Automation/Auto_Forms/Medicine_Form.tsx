import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Clock, Calendar } from 'react-feather';

interface MedicineFormProps {
  onSave: (schedule: { date: Date; startTime: Date; endTime: Date }[]) => void;
  onClose: () => void;
}

const Medicine_Form: React.FC<MedicineFormProps> = ({ onSave, onClose }) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [globalTimeRange, setGlobalTimeRange] = useState({
    startTime: new Date().setHours(9, 0, 0, 0),
    endTime: new Date().setHours(17, 0, 0, 0)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedDates.length > 0) {
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      setStartDate(sortedDates[0]);
      setEndDate(sortedDates[sortedDates.length - 1]);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  }, [selectedDates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) return;

    const schedule = selectedDates.map(date => {
      const startTime = new Date(date);
      const [startHours, startMinutes] = new Date(globalTimeRange.startTime).toTimeString().split(':').map(Number);
      startTime.setHours(startHours, startMinutes, 0, 0);

      const endTime = new Date(date);
      const [endHours, endMinutes] = new Date(globalTimeRange.endTime).toTimeString().split(':').map(Number);
      endTime.setHours(endHours, endMinutes, 0, 0);

      return {
        date: new Date(date),
        startTime,
        endTime
      };
    });

    setIsSubmitting(true);
    onSave(schedule);
    setIsSubmitting(false);
  };

  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    setSelectedDates(prevDates => {
      const dateString = date.toDateString();
      const dateExists = prevDates.some(
        selectedDate => selectedDate.toDateString() === dateString
      );

      if (dateExists) {
        return prevDates.filter(d => d.toDateString() !== dateString);
      } else {
        return [...prevDates, new Date(date)];
      }
    });
  };

  const updateGlobalTimeRange = (field: 'startTime' | 'endTime', value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    const newTime = new Date();
    newTime.setHours(hours, minutes, 0, 0);

    setGlobalTimeRange(prev => ({
      ...prev,
      [field]: newTime.getTime()
    }));
  };

  const formatTimeFromTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toTimeString().substring(0, 5);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Medication</h2>
          <p className="text-sm text-gray-500 mt-1">Select dates and set medication times</p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Calendar Section */}
            <div className="bg-white p-21 rounded-xl border border-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <h3 className="text-base font-medium text-gray-800 flex items-center mb-3">
                <Calendar className="mr-2 text-green-600" size={18} />
                Select Dates
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white w-full">
                <DatePicker
                  selected={null}
                  onChange={handleDateChange}
                  inline
                  minDate={new Date()}
                  calendarClassName="w-full border-0"
                  className="w-full"
                  dayClassName={(date) => {
                    const isSelected = selectedDates.some(
                      selectedDate => selectedDate.toDateString() === date.toDateString()
                    );
                    return `
                      text-sm transition-all duration-200 rounded-lg w-full
                      ${isSelected
                        ? 'bg-green-500/30 text-green-800 font-semibold ring-2 ring-green-400 scale-110 shadow-inner'
                        : 'text-gray-800 hover:bg-green-50 hover:scale-105'
                      }
                    `;
                  }}
                  
                  renderDayContents={(day) => (
                    <span className="w-8 h-8 flex items-center justify-center text-sm">{day}</span>
                  )}
                />
              </div>
            </div>

            {/* Time Picker Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <h3 className="text-base font-medium text-gray-800 flex items-center mb-4">
                <Clock className="mr-2 text-green-600" size={18} />
                Set Time Range
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formatTimeFromTimestamp(globalTimeRange.startTime)}
                    onChange={(e) => updateGlobalTimeRange('startTime', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formatTimeFromTimestamp(globalTimeRange.endTime)}
                    onChange={(e) => updateGlobalTimeRange('endTime', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-transparent"
                    min={formatTimeFromTimestamp(globalTimeRange.startTime)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selectedDates.length === 0 || isSubmitting}
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
              selectedDates.length === 0 || isSubmitting
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Saving...' : `Schedule (${selectedDates.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Medicine_Form;

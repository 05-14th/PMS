import { useState } from 'react';
import ControlBody from '../components/ControlBody';

function Poultry() {
  const [procedureList, setProcedureList] = useState([
    {
      name: "Introduction",
      content: "This page contains the documents necessary for raising chicken.",
      date_publish: "2025/08/11"
    },
    {
      name: "Procedure 1",
      content: "Don't be a bum",
      date_publish: "2025/08/11"
    },
    {
      name: "Procedure 2",
      content: "Don't let the heat alt f4 the chicken",
      date_publish: "2025/08/11"
    },
    {
      name: "Procedure 3",
      content: "Don't steal chicken, buy your own nig-",
      date_publish: "2025/08/11"
    },
  ]);

  const [visibleDetails, setVisibleDetails] = useState(
    Array(procedureList.length).fill(false)
  );

  const handleToggleDetails = (index) => {
    setVisibleDetails((prev) =>
      prev.map((visible, i) => (i === index ? !visible : visible))
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <ControlBody>
        <div className="flex flex-col gap-4 p-4">
          {procedureList.map((procedure, index) => (
            <div
              key={index}
              className="bg-gray-800 text-white px-6 py-3 rounded-xl border-2 border-white shadow-md hover:bg-gray-700 transition duration-300 flex flex-col"
            >
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{procedure.name}</span>
                <button
                  onClick={() => handleToggleDetails(index)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-3 py-1 text-sm"
                >
                  {visibleDetails[index] ? "Hide Details" : "Show Details"}
                </button>
              </div>

              {visibleDetails[index] && (
                <div className="mt-3 bg-gray-900 text-gray-300 p-3 rounded-lg">
                  <p><strong>Details for {procedure.name}:</strong></p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    <li>Content: {procedure.content}</li>
                    <li>Date Published: {procedure.date_publish}</li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </ControlBody>
    </div>
  );
}

export default Poultry;

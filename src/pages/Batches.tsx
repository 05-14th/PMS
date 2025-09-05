import React, { useState } from "react";
import MainBody from "../components/MainBody";
import { FaEdit, FaTrash, FaStickyNote, FaInfoCircle } from "react-icons/fa";
import ModalNotes from "./Extra/Batches/Modal_Notes";
import Detail from "./Extra/Batches/Detail";

type Batch = {
  id: string;
  name: string;
  startDate: string;
  expectedHarvestDate: string;
  totalChicken: number;
  currentChicken: number;
  status: string;
  notes?: string;
};

const Batches: React.FC = () => {
  const [selectedNote, setSelectedNote] = useState<{note: string; title: string} | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Sample data
  const batches: Batch[] = [
    {
      id: "B001",
      name: "Summer Batch 2025",
      startDate: "2025-08-01",
      expectedHarvestDate: "2025-11-15",
      totalChicken: 1000,
      currentChicken: 980,
      status: "Active",
      notes: "Regular check-up scheduled for next week. All vaccinations up to date. Feed consumption normal."
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (batch: Batch) => {
    setSelectedBatch(batch);
  };

  return (
    <MainBody>
      {/* Notes Modal */}
      <ModalNotes
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        note={selectedNote?.note || ''}
        title={selectedNote?.title || 'Note Details'}
      />

      {/* Detail Modal */}
      <Detail
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        batch={selectedBatch}
      />

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table Headers */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Harvest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(batch.startDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(batch.expectedHarvestDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.totalChicken.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{batch.currentChicken.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        batch.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (batch.notes) {
                            setSelectedNote({
                              note: batch.notes,
                              title: `Notes for ${batch.name} (${batch.id})`
                            });
                          }
                        }}
                        className={`inline-flex items-center text-sm ${batch.notes ? 'text-blue-600 hover:underline' : 'text-gray-400'}`}
                        disabled={!batch.notes}
                      >
                        <FaStickyNote className="mr-1.5 h-4 w-4" />
                        {batch.notes ? 'View Notes' : 'No Notes'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          onClick={() => handleViewDetails(batch)}
                        >
                          <FaInfoCircle className="mr-1.5 h-4 w-4" />
                          Details
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          onClick={() => console.log('Edit', batch.id)}
                        >
                          <FaEdit className="mr-1.5 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-red-600 bg-white hover:bg-red-50"
                          onClick={() => console.log('Delete', batch.id)}
                        >
                          <FaTrash className="mr-1.5 h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainBody>
  );
};

export default Batches;

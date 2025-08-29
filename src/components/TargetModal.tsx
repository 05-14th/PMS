import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import BatchForm from './BatchForm';

interface ModalProps {
  apiEndpoint: string;
  mode: 'view' | 'modify' | 'delete' | 'addBatch';
  id: number;
  param: string;
}

const TargetModal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modifiedData, setModifiedData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get props from location state
  const { apiEndpoint, mode, id, param } = location.state as ModalProps;

  function formatColumn(col: string) {
    return col.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
  }

  useEffect(() => {
    if (location.state?.openModal) {
      setIsOpen(true);
      fetchData();
    }
  }, [location.state]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (mode === 'view') {
        // POST with id to fetch data for view mode
        response = await axios.post(apiEndpoint, { [param]: id });
      } else {
        // GET for modify and delete modes
        response = await axios.get(apiEndpoint);
      }
      
      if (response.data && response.data.length > 0) {
        // Find the item with matching ID
        const item = response.data.find((item: any) => item[param] === id);
        if (item) {
          setData(item);
          setModifiedData({ ...item });
        } else {
          setError('Item not found');
        }
      } else {
        setError('No data received');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'modify') return;

    setIsSubmitting(true);
    try {
      const response = await axios.put(apiEndpoint, modifiedData);
      if (response.status === 200) {
        // Close modal on success
        setIsOpen(false);
        // Optionally refresh parent component
        window.location.reload();
      }
    } catch (err) {
      console.error('Error updating data:', err);
      setError('Failed to update data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'delete' || !confirm('Are you sure you want to delete this item?')) return;

    setIsSubmitting(true);
    try {
      const response = await axios.delete(`${apiEndpoint}/${id}`);
      if (response.status === 200) {
        // Close modal on success
        setIsOpen(false);
        // Optionally refresh parent component
        window.location.reload();
      }
    } catch (err) {
      console.error('Error deleting data:', err);
      setError('Failed to delete data');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {mode === 'view' && 'View Details'}
            {mode === 'modify' && 'Edit Item'}
            {mode === 'delete' && 'Confirm Deletion'}
            {mode === 'addBatch' && 'Add New Batch'}
          </h2>
          <button 
            onClick={() => {
              setIsOpen(false);
              navigate(-1);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div>
            {(mode === 'view' || mode === 'modify') && data && (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <label className="w-1/3 font-medium">
                        {formatColumn(key)}:
                      </label>
                      {mode === 'modify' ? (
                        <input
                          type={typeof value === 'number' ? 'number' : 'text'}
                          value={modifiedData[key] || ''}
                          onChange={(e) =>
                            setModifiedData({
                              ...modifiedData,
                              [key]: e.target.value,
                            })
                          }
                          className="flex-1 border rounded px-3 py-2"
                        />
                      ) : (
                        <span className="flex-1">{String(value)}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  {mode === 'modify' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 border rounded"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                  {mode === 'delete' && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  )}
                </div>
              </form>
            )}

            {mode === 'addBatch' && (
              <div>
                <BatchForm/>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TargetModal;

import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { div } from 'framer-motion/client';
import BatchForm from './BatchForm';
import InventoryForm from './InventoryForm';
import SupplierForm from './SupplierForm';

interface ModalProps {
  apiEndpoint: string;
  mode: 'view' | 'modify' | 'delete' | 'addBatch' | 'addInventory' | 'addSupplier';
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

  function formatColumn(col) {
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
        console.log(apiEndpoint)
      } else {
        // GET for modify and delete modes
        response = await axios.post(apiEndpoint, { [param]: id });
      }

      let record = response.data;

      if (Array.isArray(record)) {
        // Assume the backend returns an array (e.g., SELECT * FROM table WHERE id = ?)
        record = record.find(item => item[param] === id) || record[0];
      }

      setData(record);

      if (mode === 'modify') {
        setModifiedData(record);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModifiedData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModifySubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.put(apiEndpoint, modifiedData);
      await fetchData();
      alert('Data modified successfully!');
    } catch (err) {
      setError('Failed to modify data. Please try again.');
      console.error('Error modifying data:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setIsSubmitting(true);
      try {
        console.log(`${apiEndpoint}?${param}=${id}`)
        await axios.delete(`${apiEndpoint}?${param}=${id}`);
        alert('Data deleted successfully!');
        handleClose();
      } catch (err) {
        setError('Failed to delete data. Please try again.');
        console.error('Error deleting data:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const setNestedValue = (obj: any, path: string, value: any): any => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const newObj = { ...obj };
  let temp = newObj;

  for (const key of keys) {
    if (!temp[key] || typeof temp[key] !== 'object') {
      temp[key] = {};
    }
    temp = temp[key];
  }

  temp[lastKey] = value;
  return newObj;
};

const handleInputChange_ = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setModifiedData((prev: any) => setNestedValue(prev, name, value));
};

let isFirstField = true;

const renderFormFields = (obj: any, prefix = '') => {
  if (typeof obj !== 'object' || obj === null) {
    const readonly = isFirstField;
    isFirstField = false;
    return (
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">{prefix}</label>
        <input
          type="text"
          name={prefix}
          value={getNestedValue(modifiedData, prefix) ?? ''}
          onChange={handleInputChange_}
          className="w-full p-2 border rounded"
          readOnly={readonly}
        />
      </div>
    );
  }

  return (
    <div>
      {Object.entries(obj).map(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        return (
          <div key={fullKey} className="mb-4">
            {typeof value === 'object' ? (
              renderFormFields(value, fullKey)
            ) : (
              (() => {
                const readonly = isFirstField;
                isFirstField = false;
                return (
                  <>
                    <label className="block text-gray-700 mb-2">{key}</label>
                    <input
                      type="text"
                      name={fullKey}
                      value={getNestedValue(modifiedData, fullKey) ?? ''}
                      onChange={handleInputChange_}
                      className="w-full p-2 border rounded"
                      readOnly={readonly}
                    />
                  </>
                );
              })()
            )}
          </div>
        );
      })}
    </div>
  );
};

  const prettifyKey = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2");

  const renderSimpleList = (data: any): JSX.Element => {
  if (data === null || data === undefined) {
    return <p className="italic text-gray-500">No data available</p>;
  }

  if (typeof data !== "object") {
    return <span>{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <ul className="list-disc list-inside ml-4 space-y-1">
        {data.map((item, idx) => (
          <li key={idx}>{renderSimpleList(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-2 ml-2">
      {Object.entries(data).map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word

        return (
          <li key={key} className="border-b pb-1 last:border-b-0">
            <span className="font-semibold">{prettifyKey(formattedKey)}: </span>
            <span>{renderSimpleList(value)}</span>
          </li>
        );
      })}
    </ul>
  );
};

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Target Page</h1>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">
              {mode === 'view' && 'View Data'}
              {mode === 'modify' && 'Modify Data'}
              {mode === 'delete' && 'Confirm Deletion'}
              {mode === 'addBatch' && 'Add Batch'}
            </h2>

            {loading && <p className="text-center py-4">Loading...</p>}
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {!loading && data && (
              <>
                {mode === 'view' && (
                  <div className="bg-white p-4 rounded">
                    {renderSimpleList(data)}
                  </div>
                )}

                {mode === 'modify' && (
                  <>
                    {renderFormFields(data)}
                    <button
                      onClick={handleModifySubmit}
                      disabled={isSubmitting}
                      className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}

                {mode === 'delete' && (
                  <div className="text-center">
                    <p className="mb-6">Are you sure you want to delete this item?</p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="bg-red-500 text-white py-2 px-6 rounded hover:bg-red-600 disabled:bg-red-300"
                      >
                        {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={handleClose}
                        className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {(mode === 'addBatch' && (
                  <div>
                    <BatchForm/>
                  </div>
                ))}

                {(mode === 'addInventory' && (
                  <div>
                    <InventoryForm/>
                  </div>
                ))}

                {(mode === 'addSupplier' && (
                  <div>
                    <SupplierForm/>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetModal;
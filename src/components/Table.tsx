// src/components/DataTable.tsx
import React, { useState, useMemo } from 'react';

type TableProps = {
  data: any[];
  actionable: boolean;
};

const PAGE_SIZE = 10;

const Table: React.FC<TableProps> = ({ data, actionable }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        className="p-2 mb-4 border border-gray-300 rounded-lg w-full"
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1); // Reset to first page
        }}
      />

      {pageData.length === 0 ? (
        <p>No matching data</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 border-b text-left font-semibold text-gray-700">
                    {col.toUpperCase()}
                  </th>
                ))}
                {actionable && (
                  <th className="px-4 py-2 border-b text-left font-semibold text-gray-700">ACTION</th>
                )}
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, idx) => (
                <tr key={idx} className="border-b">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 text-gray-600">
                      {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                    </td>
                  ))}
                  {actionable && (
                    <td className="px-4 py-2">
                      <button
                        className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded"
                        onClick={() => console.log('Action clicked for:', row)}
                      >
                        View
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePrev}
            disabled={page === 1}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
          >
            Prev
          </button>
          <span className="text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={page === totalPages}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;

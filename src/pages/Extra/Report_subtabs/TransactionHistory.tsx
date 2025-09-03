import React, { useState, useEffect } from 'react';
import { Download, ChevronDown, Search } from 'lucide-react';
import { DatePicker, Button as AntdButton } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface Transaction {
  id: string | number;
  date: string;
  type: string;
  description: string;
  amount: string | number;
}

const TransactionHistory: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  
  // Sample batches - replace with actual data
  const batches = ['All Batches', 'Batch #001', 'Batch #002', 'Batch #003'];
  
  // Empty transactions array - will be populated with actual data
  const [transactions] = useState<Transaction[]>([]);

  const handleExport = () => {
    // Add export functionality here
    console.log('Exporting PDF...');
  };

  const handleDateChange = (dates: any, dateStrings: [string, string]) => {
    setDates(dates);
    // Trigger search when dates change
    if (dates && dates[0] && dates[1]) {
      console.log('Searching for:', { searchQuery, dates });
    }
  };

  const handleClearDates = () => {
    setDates([null, null]);
    // Trigger search when dates are cleared
    console.log('Searching for:', { searchQuery, dates: [null, null] });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger search when search query changes
    console.log('Searching for:', { searchQuery, dates });
  };

  return (
    <div className="space-y-6">
      {/* Header with Batch Dropdown and Export Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            {selectedBatch}
            <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
          </button>
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none">
              {batches.map((batch) => (
                <button
                  key={batch}
                  onClick={() => {
                    setSelectedBatch(batch);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {batch}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={handleExport}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
        >
          <Download className="h-4 w-4 mr-2 text-gray-700" />
          Export PDF
        </button>
      </div>

      {/* Search and Date Range */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent sm:text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <RangePicker
              format="YYYY-MM-DD"
              onChange={handleDateChange}
              value={dates}
              className="w-full sm:w-64"
              suffixIcon={<CalendarOutlined className="text-gray-400" />}
              placeholder={['Start Date', 'End Date']}
            />
            <AntdButton 
              onClick={handleClearDates}
              className="flex items-center"
            >
              Clear
            </AntdButton>
          </div>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {typeof transaction.amount === 'string' && transaction.amount.startsWith('-') ? (
                        <span className="text-red-600">{transaction.amount}</span>
                      ) : (
                        <span className="text-green-600">+{transaction.amount}</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
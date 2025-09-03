import React, { useState } from 'react';
import { FileText, Package, List } from 'lucide-react';
import MainBody from '../components/MainBody';
import BatchReport from './Extra/Report_subtabs/Batchreport';
import TransactionHistory from './Extra/Report_subtabs/TransactionHistory';

type TabType = 'batch' | 'transaction';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('batch');

  const tabs = [
    { id: 'batch', label: 'Batch Report', icon: <Package size={18} className="mr-1" /> },
    { id: 'transaction', label: 'Transaction History', icon: <List size={18} className="mr-1" /> },
  ];

  return (
    <MainBody>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <FileText className="h-8 w-8 mr-2 text-green-700" />
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        </div>
        
        {/* Tabs - Updated to match Sales page style */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium leading-5 transition-all duration-200 flex items-center justify-center ${
                activeTab === tab.id
                  ? 'bg-white shadow-md text-green-600'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-green-700'
              }`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          {activeTab === 'batch' && <BatchReport />}
          {activeTab === 'transaction' && <TransactionHistory />}
        </div>
      </div>
    </MainBody>
  );
};

export default Reports;

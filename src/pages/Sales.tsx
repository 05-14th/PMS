import React, { useState } from 'react';
import MainBody from '../components/MainBody';
import NewSale from './Extra/Sales_TabPages/NewSale';
import SaleHistory from './Extra/Sales_TabPages/SaleHistory';
import Customers from './Extra/Sales_TabPages/Customers';

// Define the tab types
type TabType = 'new' | 'history' | 'customers';

// Define the tabs in the desired order
const tabs: { id: TabType; label: string }[] = [
  { id: 'new', label: 'New Sale' },
  { id: 'history', label: 'Sale History' },
  { id: 'customers', label: 'Customers' },
];

const Sales: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('new');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'new':
        return <NewSale />;
      case 'history':
        return <SaleHistory />;
      case 'customers':
        return <Customers />;
      default:
        return <NewSale />;
    }
  };

  return (
    <MainBody>
      <div className="p-6">
        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white shadow-md text-green-600'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-green-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </MainBody>
  );
};

export default Sales;

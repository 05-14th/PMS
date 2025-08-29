import { useState } from 'react';
import MainBody from '../components/MainBody';

function Inventory() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'supplier'>('inventory');

  return (
    <MainBody>
      <div className="p-6">
        {/* Modern Tabs */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          <button
            className={`flex-1 rounded-md py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
              activeTab === 'inventory'
                ? 'bg-white shadow-md text-green-600'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-green-700'
            }`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`flex-1 rounded-md py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
              activeTab === 'supplier'
                ? 'bg-white shadow-md text-green-600'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('supplier')}
          >
            Supplier
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'inventory' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              {/* Inventory content will go here */}
              <p className="text-gray-500">Inventory content coming soon</p>
            </div>
          )}
          {activeTab === 'supplier' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              {/* Supplier content will go here */}
              <p className="text-gray-500">Supplier content coming soon</p>
            </div>
          )}
        </div>
      </div>
    </MainBody>
  );
}

export default Inventory;

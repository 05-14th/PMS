import { useState } from 'react';
import MainBody from '../components/MainBody';
import ConnectModal from '../components/ConnectModal';
import AtAGlance from './Extra/Dashboard/AtAGlance';
import LiveOperation from './Extra/Dashboard/LiveOperation';
import FinancialForecast from './Extra/Dashboard/FinancialForecast';

// Types
type DashboardData = {
  currentPopulation: number;
  totalBirds: number;
  monthlyRevenue: number;
  sellableInventory: number;
  accruedCost: number;
};

type Batch = {
  id: string;
  age: number;
  population: number;
  daysToHarvest?: number;
};

type StockItem = {
  id: string;
  name: string;
  level: number;
  status: 'low' | 'adequate' | 'good';
  quantity: string;
};

type FinancialData = {
  batchId: string;
  batchName: string;
  accruedCost: number;
  estimatedRevenue: number;
  progress: number;
  startDate: string;
  endDate: string;
};

const HomePage = () => {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  
  // Dashboard data
  const dashboardData: DashboardData = {
    currentPopulation: 2,
    totalBirds: 5000,
    monthlyRevenue: 250000,
    sellableInventory: 1500,
    accruedCost: 1200000,
  };

  // Batches data
  const batches: Batch[] = [
    { id: 'B-2023-001', age: 35, population: 2500, daysToHarvest: 2 },
    { id: 'B-2023-002', age: 42, population: 2500, daysToHarvest: 5 },
  ];

  // Stock items data
  const stockItems: StockItem[] = [
    { 
      id: 'feed',
      name: 'Feed (50kg bags)', 
      level: 25, 
      status: 'low', 
      quantity: '12 left' 
    },
    { 
      id: 'vaccines',
      name: 'Vaccines', 
      level: 70, 
      status: 'adequate', 
      quantity: '' 
    },
  ];

  // Financial forecast data
  const financialData: FinancialData[] = [
    {
      batchId: 'B-2023-001',
      batchName: 'Batch 1',
      accruedCost: 30057,
      estimatedRevenue: 65000,
      progress: 46,
      startDate: '2023-07-15',
      endDate: '2023-10-15'
    },
    {
      batchId: 'B-2023-002',
      batchName: 'Batch 2',
      accruedCost: 28000,
      estimatedRevenue: 70000,
      progress: 40,
      startDate: '2023-08-01',
      endDate: '2023-10-30'
    }
  ];

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <MainBody>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
            Dashboard Overview
          </h1>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Refresh Data
          </button>
        </header>

        <main className="space-y-6">
          <AtAGlance data={dashboardData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveOperation batches={batches} stockItems={stockItems} />
            <FinancialForecast data={financialData} />
          </div>
        </main>
      </div>
    </MainBody>
  );
};

export default HomePage;
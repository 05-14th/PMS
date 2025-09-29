import { useState, useEffect } from "react";
import MainBody from "../components/MainBody";
import AtAGlance from "./Extra/Dashboard/AtAGlance";
import LiveOperation from "./Extra/Dashboard/LiveOperation";
import RevenueChart from "./Extra/Dashboard/RevenueChart";
import CostBreakdownChart from "./Extra/Dashboard/CostBreakdownChart";
import AlertsPanel from "./Extra/Dashboard/AlertsPanel";
import FinancialForecast from "./Extra/Dashboard/FinancialForecast";

// Define the main data type
interface DashboardApiData {
  atAGlance: any;
  activeBatches: any[];
  stockItems: any[];
  charts: {
    revenueTimeline: any[];
    costBreakdown: any[];
  };
  alerts: any[];
  financialForecasts: any[];
}

const HomePage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardApiData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/dashboard");
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <MainBody>
        <div>Loading Dashboard...</div>
      </MainBody>
    );
  }

  if (!dashboardData) {
    return (
      <MainBody>
        <div>Could not load dashboard data. Please try refreshing.</div>
      </MainBody>
    );
  }

  return (
    <MainBody>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
            Dashboard Overview
          </h1>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            {/* Refresh SVG */}
            Refresh Data
          </button>
        </header>

        <main className="space-y-6">
          <AtAGlance data={dashboardData.atAGlance} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <RevenueChart data={dashboardData.charts.revenueTimeline} />
              <CostBreakdownChart data={dashboardData.charts.costBreakdown} />
            </div>

            <div className="space-y-6">
              <AlertsPanel alerts={dashboardData.alerts} />
              <LiveOperation
                batches={dashboardData.activeBatches}
                stockItems={dashboardData.stockItems}
              />
            </div>
          </div>

          <FinancialForecast data={dashboardData.financialForecasts} />
        </main>
      </div>
    </MainBody>
  );
};

export default HomePage;

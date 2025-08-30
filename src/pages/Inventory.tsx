import { useState } from "react";
import MainBody from "../components/MainBody";

// ✅ Make sure these exist in: src/pages/Extra/
import StockLevels from "./Extra/StockLevels";
import ItemList from "./Extra/Itemlist";
import Inventory from "./Extra/Inventory";

type TabType = "inventory" | "items" | "stock";

const tabs: { id: TabType; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "items", label: "Items" },
  { id: "stock", label: "Stock Levels" },
];

function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("inventory");

  const renderTabContent = () => {
    switch (activeTab) {
      case "inventory":
        return <Inventory />;
      case "items":
        return <ItemList />;
      case "stock":
        return <StockLevels />;
      default:
        return <Inventory />;
    }
  };

  return (
    <MainBody>
      <div className="p-6">
        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white shadow-md text-green-600"
                  : "text-gray-600 hover:bg-white/[0.12] hover:text-green-700"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </MainBody>
  );
}

export default InventoryPage;

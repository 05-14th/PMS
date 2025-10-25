import { useState } from "react";
import MainBody from "../components/MainBody";
import StockLevels from "./Extra/Inventory/StockLevels";
import ItemList from "./Extra/Inventory/Itemlist";
import Supplier from "./Extra/Inventory/Supplier";
import HarvestedProducts from "./Extra/Inventory/HarvestedProducts";

type TabType = "stock" | "items" | "suppliers" | "harvested";

const tabs: { id: TabType; label: string }[] = [
  { id: "harvested", label: "Harvested Products" },
  { id: "stock", label: "Raw Materials Stock" },
  { id: "items", label: "Item List" },
  { id: "suppliers", label: "Suppliers" },
];

function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("harvested");

  const renderTabContent = () => {
    switch (activeTab) {
      case "harvested":
        return <HarvestedProducts />;
      case "stock":
        return <StockLevels />;
      case "items":
        return <ItemList />;
      case "suppliers":
        return <Supplier />;
      default:
        return <HarvestedProducts />;
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

        {/* Tab Content */}
        <div className="mt-4">{renderTabContent()}</div>
      </div>
    </MainBody>
  );
}

export default InventoryPage;

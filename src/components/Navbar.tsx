import React, { useState } from "react";
import ConnectModal from "./ConnectModal";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LayoutDashboard,
  Thermometer,
  Droplets,
  Feather,
  Bell,
  ServerCog,
  LogOut,
  UserCircle,
  Plug,
  LayoutList
} from "lucide-react";

interface NavbarProps {
  isControl: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isControl = false }) => {
  const navigate = useNavigate();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <nav className="p-4 shadow-md" style={{ backgroundColor: "#576070" }}>
      <div className="container mx-auto flex items-center justify-between w-full px-2 sm:px-0">
        {/* Left: Logo */}
        <Link to="/homepage" className="flex items-center">
          <img src="/Extras/logo.png" alt="Logo" className="h-10 w-auto" />
        </Link>

        {/* Center: Navigation links */}
        <ul className="hidden sm:flex-grow sm:flex sm:justify-center sm:space-x-12 sm:items-center">
          {!isControl ? (
            <>
              <li>
                <Link
                  to="/homepage"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Home size={20} />
                  <span>Home</span>
                </Link>
              </li>
              
              {/* Inventory Dropdown */}
              <li>
                <Link
                  to="/inventory"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Package size={20} />
                  <span>Inventory</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/batches"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <LayoutList size={20} />
                  <span>Batches</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/sales"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <ShoppingCart size={20} />
                  <span>Sales</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/suppliers"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Users size={20} />
                  <span>Suppliers</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/control"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Settings size={20} />
                  <span>Control</span>
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/control"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/environment"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Thermometer size={20} />
                  <span>Environmental Control</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/feedWater"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Droplets size={20} />
                  <span>Feeding & Watering</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/poultry"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Feather size={20} />
                  <span>Poultry</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/notification"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Bell size={20} />
                  <span>Notification</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/homepage"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <ServerCog size={20} />
                  <span>System</span>
                </Link>
              </li>
            </>
          )}
        </ul>

 {/* Right: Profile and Logout */}
        <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
          {/* Mobile Notification Bell comes before Connect Button */}
          <div className="flex sm:hidden space-x-2">
            <Link to="/notification" className="text-white">
              <Bell size={28} className="hover:text-orange-500" />
            </Link>
            {/* Connect Button */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-500 transition"
            >
              <Plug size={20} className="mr-1" />
              <span>Connect</span>
            </button>
          </div>

          {/* Connect Modal */}
          <ConnectModal
            isOpen={isConnectModalOpen}
            onClose={() => setIsConnectModalOpen(false)}
          />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center bg-orange-600 text-white px-3 py-1 rounded-full hover:bg-orange-500 transition"
          >
            <LogOut size={20} className="mr-0" />
            <span>Logout</span>
          </button>

          {/* User Profile Image Placeholder (visible on all views) */}
          <div className="ml-2">
            <img
              src="/Extras/user-placeholder.png"
              alt="User"
              className="h-10 w-10 rounded-full object-cover border-2 border-white shadow"
            />
          </div>
        </div>
      </div>

      {/* Bottom Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-[#576070] shadow-inner z-50">
        <ul className="flex justify-around items-center py-2 text-xs">
          {/* Always show Batches tab except when isControl is true */}
          {!isControl && (
            <>
              <li className="w-1/6 text-center">
                <Link
                  to="/homepage"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <Home size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Home</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/inventory"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <Package size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Inventory</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/batches"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <LayoutList size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Batches</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/sales"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <ShoppingCart size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Sales</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/suppliers"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <Users size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Suppliers</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/control"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <Settings size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Control</span>
                </Link>
              </li>
            </>
          )}
          {/* If isControl, show only control-related tabs, but hide Batches */}
          {isControl && (
            <>
              <li className="w-1/5 text-center">
                <Link
                  to="/homepage"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <ServerCog size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">System</span>
                </Link>
              </li>
              <li className="w-1/5 text-center">
                <Link
                  to="/control"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <LayoutDashboard size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Dashboard</span>
                </Link>
              </li>
              <li className="w-1/5 text-center">
                <Link
                  to="/environment"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <Thermometer size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Environmental Control</span>
                </Link>
              </li>
              <li className="w-1/5 text-center">
                <Link
                  to="/feedWater"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <Droplets size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Feeding & Watering</span>
                </Link>
              </li>
              <li className="w-1/5 text-center">
                <Link
                  to="/poultry"
                  className="flex flex-col items-center text-white hover:text-orange-500"
                >
                  <Feather size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Poultry</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
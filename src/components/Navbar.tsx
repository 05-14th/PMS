import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  ShoppingCart,
  Settings,
  LayoutDashboard,
  Feather,
  Bell,
  ServerCog,
  LogOut,
  LayoutList
} from "lucide-react";

interface NavbarProps {
  isControl: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isControl = false }) => {
  const navigate = useNavigate();
  const [] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/");
  };

  return (
    <nav className="p-4 shadow-md bg-green-800">
      <div className="container mx-auto flex items-center justify-between w-full px-2 sm:px-0">
        {/* Left: Logo */}
        <Link to="/homepage" className="flex items-center">
          <img src="/Extras/logo.png" alt="Logo" className="h-8 w-auto" />
        </Link>

        {/* Center: Navigation links */}
        <ul className="hidden sm:flex-grow sm:flex sm:justify-center sm:space-x-12 sm:items-center">
          {!isControl ? (
            <>
              <li>
                <Link
                  to="/homepage"
                  className="flex items-center text-white hover:text-green-500 space-x-1"
                >
                  <Home size={20} />
                  <span>Home</span>
                </Link>
              </li>
              
              {/* Inventory Dropdown */}
              <li>
                <Link
                  to="/inventory"
                  className="flex items-center text-white hover:text-green-500 space-x-1"
                >
                  <Package size={20} />
                  <span>Inventory</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/batches"
                  className="flex items-center text-white hover:text-green-500 space-x-1"
                >
                  <LayoutList size={20} />
                  <span>Batches</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/sales"
                  className="flex items-center text-white hover:text-green-500 space-x-1"
                >
                  <ShoppingCart size={20} />
                  <span>Sales</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/control"
                  className="flex items-center text-white hover:text-green-500 space-x-1"
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
                  to="/poultry"
                  className="flex items-center text-white hover:text-green-500 space-x-1"
                >
                  <Feather size={20} />
                  <span>Poultry</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/notification"
                  className="flex items-center text-white hover:text-green-500 space-x-1"
                >
                  <Bell size={20} />
                  <span>Notification</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/homepage"
                  className="flex items-center text-white hover:text-green-500 space-x-1"
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
          {/* Mobile Profile and Logout */}
          <div className="flex sm:hidden items-center space-x-3">
            <button
              onClick={handleLogout}
              className="flex items-center text-white hover:text-green-500"
              title="Logout"
            >
              <LogOut size={24} />
            </button>
          </div>

          {/* Desktop Profile and Logout */}
          <div className="hidden sm:flex items-center space-x-2">
      

            {/* Logout Button - Moved after profile for web view */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center text-gray-300 hover:text-gray-500 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-green-800 shadow-inner z-50">
        <ul className="flex justify-around items-center py-2 text-xs">
          {/* Always show Batches tab except when isControl is true */}
          {!isControl && (
            <>
              <li className="w-1/6 text-center">
                <Link
                  to="/homepage"
                  className="flex flex-col items-center text-white hover:text-green-500"
                >
                  <Home size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Home</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/inventory"
                  className="flex flex-col items-center text-white hover:text-green-500"
                >
                  <Package size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Inventory</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/batches"
                  className="flex flex-col items-center text-white hover:text-green-500"
                >
                  <LayoutList size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Batches</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/sales"
                  className="flex flex-col items-center text-white hover:text-green-500"
                >
                  <ShoppingCart size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Sales</span>
                </Link>
              </li>
              <li className="w-1/6 text-center">
                <Link
                  to="/control"
                  className="flex flex-col items-center text-white hover:text-green-500"
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
                  className="flex flex-col items-center text-white hover:text-green-500"
                >
                  <ServerCog size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">System</span>
                </Link>
              </li>
              <li className="w-1/5 text-center">
                <Link
                  to="/poultry"
                  className="flex flex-col items-center text-white hover:text-green-500"
                >
                  <Feather size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Poultry</span>
                </Link>
              </li>
              <li className="w-1/5 text-center">
                <Link
                  to="/notification"
                  className="flex flex-col items-center text-white hover:text-green-500"
                >
                  <Bell size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">Notification</span>
                </Link>
              </li>
              <li className="w-1/5 text-center">
                <Link
                  to="/homepage"
                  className="flex flex-col items-center text-white hover:text-green-500"
                >
                  <ServerCog size={20} />
                  <span className="text-[11px] leading-tight whitespace-normal">System</span>
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
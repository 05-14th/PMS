import React from "react";
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
} from "lucide-react";

interface NavbarProps {
  isControl: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isControl = false }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <nav className="p-4 shadow-md" style={{ backgroundColor: "#576070" }}>
      <div className="container mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/homepage" className="flex items-center">
          <img src="/Extras/logo.png" alt="Logo" className="h-10 w-auto" />
        </Link>

        {/* Toggle Button for Mobile */}
        <div className="sm:hidden flex items-center">
          <button className="text-white">
            Menu
          </button>
        </div>

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
                  to="/sales"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <ShoppingCart size={20} />
                  <span>Sales</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/users"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Users size={20} />
                  <span>Users</span>
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
        <div className="flex items-center space-x-6">
          <UserCircle size={28} className="text-white" />
          <button
            onClick={handleLogout}
            className="flex items-center bg-orange-600 text-white px-3 py-1 rounded-full hover:bg-orange-500 transition"
          >
            <LogOut size={20} className="mr-1" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="sm:hidden">
        <ul className="flex flex-col items-center space-y-4 py-4">
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
                  to="/sales"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <ShoppingCart size={20} />
                  <span>Sales</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/users"
                  className="flex items-center text-white hover:text-orange-500 space-x-1"
                >
                  <Users size={20} />
                  <span>Users</span>
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
      </div>
    </nav>
  );
};

export default Navbar;
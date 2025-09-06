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
  LayoutList,
  Layers,
  FileText
} from "lucide-react";

interface NavbarProps {
  isControl: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isControl = false }) => {
  const navigate = useNavigate();
  const [] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");  
    navigate("/");
  };

  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole") || "";

  return (
    <>
      {/* Mobile Header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 bg-green-800 text-white px-4 py-2 flex items-center justify-between z-50 border-b border-green-700">
        <Link to="/homepage" className="flex items-center">
          <span className="font-bold text-white text-lg">Chickmate</span>
        </Link>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-xs font-medium truncate max-w-[100px]">{userEmail}</div>
            <div className="text-[10px] text-green-200 truncate">{userRole}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded-full hover:bg-green-700 text-white"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden sm:flex flex-col h-screen w-64 bg-green-800 text-white fixed left-0 top-0 border-r border-green-700 z-50">
        {/* Logo */}
        <Link to="/homepage" className="flex items-center justify-center p-4 border-b border-green-700">
          <img src="/Extras/logo.png" alt="Logo" className="h-10 w-auto" />
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-4">
            {!isControl ? (
              <>
                <NavItem to="/homepage" icon={<Home size={20} />} text="Home" />
                <NavItem to="/inventory" icon={<Package size={20} />} text="Inventory" />
                <NavItem to="/batches" icon={<LayoutList size={20} />} text="Batches" />
                <NavItem to="/sales" icon={<ShoppingCart size={20} />} text="Sales" />
                <NavItem to="/reports" icon={<FileText size={20} />} text="Reports" />
                <NavItem to="/control" icon={<Settings size={20} />} text="Control" />
              </>
            ) : (
              <>
                <NavItem to="/notification" icon={<Bell size={20} />} text="Notification" />
                <NavItem to="/homepage" icon={<ServerCog size={20} />} text="System" />
              </>
            )}
          </ul>
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 border-t border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="font-medium text-white truncate max-w-[140px]">{userEmail}</div>
                <div className="text-green-200 text-xs">{userRole}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded-full hover:bg-green-700 text-white"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-green-800 text-white shadow-lg z-40 pt-1">
        <ul className="flex justify-around">
          {!isControl ? (
            <>
              <MobileNavItem to="/homepage" icon={<Home size={20} />} text="Home" />
              <MobileNavItem to="/inventory" icon={<Package size={20} />} text="Inventory" />
              <MobileNavItem to="/batches" icon={<LayoutList size={20} />} text="Batches" />
              <MobileNavItem to="/sales" icon={<ShoppingCart size={20} />} text="Sales" />
              <MobileNavItem to="/reports" icon={<FileText size={20} />} text="Reports" />
              <MobileNavItem to="/control" icon={<Settings size={20} />} text="Control" />
            </>
          ) : (
            <>
              <MobileNavItem to="/notification" icon={<Bell size={20} />} text="Notification" />
              <MobileNavItem to="/homepage" icon={<ServerCog size={20} />} text="System" />
            </>
          )}
        </ul>
      </div>
    </>
  );
};

// Desktop Nav Item Component
const NavItem = ({ to, icon, text }: { to: string; icon: React.ReactNode; text: string }) => (
  <li>
    <Link
      to={to}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-700 text-white transition-colors"
    >
      <span className="text-white">{icon}</span>
      <span className="text-white text-sm">{text}</span>
    </Link>
  </li>
);

// Mobile Nav Item Component
const MobileNavItem = ({ to, icon, text }: { to: string; icon: React.ReactNode; text: string }) => (
  <li className="w-1/6 text-center">
    <Link
      to={to}
      className="flex flex-col items-center justify-center py-2 text-white hover:text-white text-xs"
    >
      <div className="mb-1 text-white">{icon}</div>
      <span className="text-white text-[11px] leading-tight">{text}</span>
    </Link>
  </li>
);

export default Navbar;
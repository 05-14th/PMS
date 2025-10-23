import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
  FileText,
} from "lucide-react";

interface NavbarProps {
  isControl: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isControl = false }) => {
  const navigate = useNavigate();
  const [] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const username = localStorage.getItem("username") || "";
  const userRole = localStorage.getItem("userRole") || "";

  return (
    <>
      {/* Mobile Header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 bg-green-800 text-white px-4 py-2 flex items-center justify-between z-50 border-b border-green-700">
        <Link to="/homepage" className="flex items-center nav-item">
          <span className="font-bold text-lg">Chickmate</span>
        </Link>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-sm font-medium text-white truncate max-w-[100px]">
              {username}
            </div>
            <div className="text-xs text-green-200 truncate">{userRole}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded-full hover:bg-green-700 text-white"
            title="Logout"
          >
            <LogOut size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden sm:flex flex-col h-screen w-64 bg-green-800 text-white fixed left-0 top-0 border-r border-green-700 z-50">
        {/* Logo */}
        <Link
          to="/homepage"
          className="flex items-center justify-center p-4 border-b border-green-700 nav-item"
        >
          <img src="/Extras/logo.png" alt="Logo" className="h-10 w-auto" />
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-4 px-4 py-4">
            {!isControl ? (
              <>
                <NavItem
                  to="/homepage"
                  icon={<Home size={28} className="text-white" />}
                  text="Home"
                />
                <NavItem
                  to="/inventory"
                  icon={<Package size={28} className="text-white" />}
                  text="Inventory"
                />
                <NavItem
                  to="/batches"
                  icon={<LayoutList size={28} className="text-white" />}
                  text="Batches"
                />
                <NavItem
                  to="/sales"
                  icon={<ShoppingCart size={28} className="text-white" />}
                  text="Sales"
                />
                <NavItem
                  to="/reports"
                  icon={<FileText size={28} className="text-white" />}
                  text="Reports"
                />
                <NavItem
                  to="/control"
                  icon={<Settings size={28} className="text-white" />}
                  text="Control"
                />
              </>
            ) : (
              <>
                <NavItem
                  to="/notification"
                  icon={<Bell size={28} className="text-white" />}
                  text="Notification"
                />
                <NavItem
                  to="/homepage"
                  icon={<ServerCog size={28} className="text-white" />}
                  text="System"
                />
              </>
            )}
          </ul>
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 border-t border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 nav-item">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="font-medium text-white truncate max-w-[140px]">
                  {username}
                </div>
                <div className="text-green-200 text-xs">{userRole}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded-full hover:bg-green-700 text-white"
              title="Logout"
            >
              <LogOut size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-green-800 text-white shadow-lg z-40 pt-1">
        <ul className="flex justify-around">
          {!isControl ? (
            <>
              <MobileNavItem
                to="/homepage"
                icon={<Home size={24} className="text-white" />}
                text="Home"
              />
              <MobileNavItem
                to="/inventory"
                icon={<Package size={24} className="text-white" />}
                text="Inventory"
              />
              <MobileNavItem
                to="/batches"
                icon={<LayoutList size={24} className="text-white" />}
                text="Batches"
              />
              <MobileNavItem
                to="/sales"
                icon={<ShoppingCart size={24} className="text-white" />}
                text="Sales"
              />
              <MobileNavItem
                to="/reports"
                icon={<FileText size={24} className="text-white" />}
                text="Reports"
              />
              <MobileNavItem
                to="/control"
                icon={<Settings size={24} className="text-white" />}
                text="Control"
              />
            </>
          ) : (
            <>
              <MobileNavItem
                to="/notification"
                icon={<Bell size={24} className="text-white" />}
                text="Notification"
              />
              <MobileNavItem
                to="/homepage"
                icon={<ServerCog size={24} className="text-white" />}
                text="System"
              />
            </>
          )}
        </ul>
      </div>
    </>
  );
};

// Desktop Nav Item Component with Animation
const NavItem = ({
  to,
  icon,
  text,
}: {
  to: string;
  icon: React.ReactNode;
  text: string;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <motion.li
      className="nav-item"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={to}
        className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 text-lg font-medium text-white ${
          isActive
            ? "bg-green-700 shadow-lg"
            : "hover:bg-green-700/80 hover:shadow-md"
        }`}
      >
        <motion.span
          className="flex-shrink-0"
          animate={{
            rotate: isActive ? [0, 10, -10, 10, 0] : 0,
            scale: isActive ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.span>
        <motion.span
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {text}
        </motion.span>
        {isActive && (
          <motion.div
            className="absolute right-0 h-8 w-1 bg-white rounded-l-lg"
            layoutId="activeNav"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    </motion.li>
  );
};

// Mobile Nav Item Component with Animation
const MobileNavItem = ({
  to,
  icon,
  text,
}: {
  to: string;
  icon: React.ReactNode;
  text: string;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <motion.li className="flex-1 mobile-nav-item" whileTap={{ scale: 0.95 }}>
      <Link
        to={to}
        className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 text-white ${
          isActive ? "bg-green-700" : "hover:bg-green-700/80"
        }`}
      >
        <motion.span
          className="mb-1"
          animate={isActive ? { y: [0, -3, 0] } : {}}
          transition={{ repeat: isActive ? Infinity : 0, duration: 1.5 }}
        >
          {icon}
        </motion.span>
        <motion.span
          className="text-sm font-medium"
          animate={isActive ? { scale: 1.1 } : {}}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {text}
        </motion.span>
      </Link>
    </motion.li>
  );
};

export default Navbar;

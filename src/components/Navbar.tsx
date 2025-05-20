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
} from "lucide-react";

interface NavbarProps {
  isControl: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isControl = false }) => {
  return (
    <nav className="bg-black p-4 shadow-md">
      <div className="container mx-auto flex justify-center items-center">
        <ul className="flex space-x-8">
          {!isControl ? (
            <>
              <li>
                <Link to="/homepage" className="text-white hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/inventory" className="text-white hover:underline">
                  Inventory
                </Link>
              </li>
              <li>
                <Link to="/sales" className="text-white hover:underline">
                  Sales
                </Link>
              </li>
              <li>
                <Link to="/users" className="text-white hover:underline">
                  Users
                </Link>
              </li>
              <li>
                <Link to="/control" className="text-white hover:underline">
                  Control
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/control" className="text-white hover:underline">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/environment" className="text-white hover:underline">
                  Environmental Control
                </Link>
              </li>
              <li>
                <Link to="/feedWater" className="text-white hover:underline">
                  Feeding and Watering
                </Link>
              </li>
              <li>
                <Link to="/poultry" className="text-white hover:underline">
                  Poulty
                </Link>
              </li>
              <li>
                <Link to="/notification" className="text-white hover:underline">
                  Notification
                </Link>
              </li>
              <li>
                <Link to="/homepage" className="text-white hover:underline">
                  System
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

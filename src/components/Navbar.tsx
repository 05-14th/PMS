import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-grey-400 p-4 shadow-md">
      <div className="container mx-auto flex justify-center items-center">
        <ul className="flex space-x-8">
          <li>
            <Link to="/homepage" className="text-white hover:underline" onClick={() => setIsOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/inventory" className="text-white hover:underline" onClick={() => setIsOpen(false)}>
              Inventory
            </Link>
          </li>
          <li>
            <Link to="/sales" className="text-white hover:underline" onClick={() => setIsOpen(false)}>
              Sales
            </Link>
          </li>
          <li>
            <Link to="/users" className="text-white hover:underline" onClick={() => setIsOpen(false)}>
              Users
            </Link>
          </li>
          <li>
            <Link to="/control" className="text-white hover:underline" onClick={() => setIsOpen(false)}>
                Control
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-grey-400 p-4 shadow-md">
      <div className="container mx-auto flex justify-center items-center">
        <ul className="flex space-x-8">
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
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

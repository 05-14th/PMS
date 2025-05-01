import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import './App.css'
import LoginModal from './pages/LoginModal'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'
import Inventory from './pages/Inventory'
import UserPage from './pages/UserPage'
import Control from './pages/Control'
import Sales from './pages/Sales'

function App() {
  return (
    <div className="min-h-screen bg-black">
      <div>
        <Router>
          <Routes>
            <Route path="/" element={<LoginModal />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/homepage" element={<HomePage />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/users" element={<UserPage />} />
            <Route path="/control" element={<Control />} />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App;

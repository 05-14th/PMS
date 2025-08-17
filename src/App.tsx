import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import './App.css'
import LoginModal from './pages/LoginModal'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'
import Inventory from './pages/Inventory'
import Supplier from './pages/Supplier'
import Control from './pages/Control'
import Sales from './pages/Sales'
import Environment from './controlPage/Environment'
import FeedingWatering from './controlPage/FeedingWatering'
import Poultry from './controlPage/Poultry'
import Notification from './controlPage/Notification'
import TargetModal from './components/TargetModal'
import Products from './pages/Product'
import Batches from './pages/Batches'



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
            <Route path="/batches" element={<Batches />} />
            <Route path="/products" element={<Products />}/>
            <Route path="/sales" element={<Sales />} />
            <Route path="/suppliers" element={<Supplier />} />
            <Route path="/control" element={<Control />} />
            <Route path="/environment" element={<Environment />} />
            <Route path="/feedWater" element={<FeedingWatering />} />
            <Route path="/poultry" element={<Poultry />} />
            <Route path="/notification" element={<Notification />} />
            <Route path="/target" element={<TargetModal />} />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App;

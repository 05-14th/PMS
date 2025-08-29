// import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import './App.css'
import LoginModal from './pages/LoginModal'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'
import Inventory from './pages/Inventory'

import Control from './pages/Control'
import Sales from './pages/Sales'


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
            <Route path="/login" element={<LoginModal />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/homepage" element={<HomePage />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/products" element={<Products />}/>
            <Route path="/sales" element={<Sales />} />
   
            <Route path="/control" element={<Control />} />
       
            <Route path="/poultry" element={<Poultry />} />
            <Route path="/notification" element={<Notification />} />

          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App;

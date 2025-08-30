import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import './App.css'
import LoginModal from './pages/LoginModal'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'
import Inventory from './pages/Inventory'
import ProtectedRoute from "./components/ProtectedRoute";
import Cookies from "js-cookie";
import axios from "axios";

import Control from './pages/Control'
import Sales from './pages/Sales'

import Poultry from './controlPage/Poultry'
import Notification from './controlPage/Notification'
import TargetModal from './components/TargetModal'
import Products from './pages/Product'
import Batches from './pages/Batches'

const Logout = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8080/api/logout");
      Cookies.remove("session_token");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};

function App() {
  return (
    <div className="min-h-screen bg-black">
      <div>
        <Router>
          <Routes>
            <Route path="/" element={<LoginModal />} />
            <Route path="/login" element={<LoginModal />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/homepage" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/batches" element={<ProtectedRoute><Batches /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>}/>
            <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
   
            <Route path="/control" element={<ProtectedRoute><Control /></ProtectedRoute>} />
       
            <Route path="/poultry" element={<ProtectedRoute><Poultry /></ProtectedRoute>} />
            <Route path="/notification" element={<ProtectedRoute><Notification /></ProtectedRoute>} />
            <Route path="/logout" element={<Logout />} />

          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App;

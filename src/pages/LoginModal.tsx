import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';

const LoginModal: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isAuthenticated = Cookies.get('session_token');
    if (isAuthenticated) {
      navigate('/homepage');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        Cookies.set('session_token', data.token, { expires: 1 }); // Assumes token is returned in `data.token`
        navigate("/homepage");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to connect to the server. Please try again later.");
    }
  };

  const handleSignUpRedirect = () => {
    navigate("/signup");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen">
      {/* Illustration - Top in mobile, right in desktop */}
      <div className="flex items-center justify-center bg-green-800 w-full md:w-2/5 h-85 sm:h-48 md:h-auto order-1 md:order-2">
        <img
          src="/Extras/logo2.png"
          alt="Chickmate Logo"
          className="w-24 sm:w-40 md:w-50"
        />
      </div>

      {/* Login Form with background - Bottom in mobile, left in desktop */}
      <div 
        className="flex-1 flex items-center justify-center order-2 md:order-1 bg-cover bg-center"
        style={{
          backgroundImage: "url('/Extras/chicken.png')",
        }}
      >
        <div className="bg-white rounded-[40px] p-6 md:p-10 w-11/12 max-w-md shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Login</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="mt-1 w-full px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="mt-1 w-full px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mx-auto block bg-green-600 hover:bg-green-400 text-white px-6 py-2 rounded-full text-sm shadow-md"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
            <div className="text-center mt-4 text-sm">
              <span className="text-gray-600">Don't have an account yet? </span>
              <button
                type="button"
                onClick={handleSignUpRedirect}
                className="text-green-500 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from 'react'

const mockLogin = async (username: string, password: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Replace with real validation logic or API call
        resolve(username === "admin" && password === "password");
      }, 1000);
    });
  };
  

const LoginModal: React.FC = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const success = await mockLogin(username, password);

        setLoading(false);
        if (success) {
        navigate("/homepage"); // Redirect on success
        } else {
        setError("Invalid username or password");
        }
    };

    const handleSignUpRedirect = () => {
        navigate("/signup");
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
                {loading ? "Signing in..." : "Login"}
            </button>
            <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">Don't have an account? </span>
            <button
                onClick={handleSignUpRedirect}
                className="text-blue-500 hover:underline text-sm font-medium"
            >
                Sign Up
            </button>
            </div>
            </form>
        </div>
        </div>
    );
};

export default LoginModal;

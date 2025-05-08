import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const mockLogin = async (username: string, password: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
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
      navigate("/homepage");
    } else {
      setError("Invalid username or password");
    }
  };

  const handleSignUpRedirect = () => {
    navigate("/signup");
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Left Side - Background Image with Form */}
      <div
        className="w-3/5 flex items-center justify-center"
        style={{
          backgroundImage: "url('/Extras/chicken.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Login</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold">Email</label>
              <input
                type="text"
                placeholder="Enter your email"
                className="mt-1 w-full px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="mt-1 w-full px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mx-auto block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm shadow-md"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
            <div className="text-center mt-4 text-sm">
              <span className="text-gray-600">Dont have account yet? </span>
              <button
                type="button"
                onClick={handleSignUpRedirect}
                className="text-orange-500 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Logo or Illustration */}
      <div className="w-2/5 flex items-center justify-center bg-[#576070]">
        <img src="\Extras\logo2.png" alt="Chickmate Logo" className="w-60" />
      </div>
    </div>
  );
};

export default LoginModal;

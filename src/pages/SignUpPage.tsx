import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file)); // preview before upload
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !username ||
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !role ||
      !profilePic
    ) {
      setError("Please fill in all required fields including profile picture.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('suffix', suffix);
      formData.append('email', email);
      formData.append('phoneNumber', phoneNumber);
      formData.append('password', password);
      formData.append('role', role);
      
      // Append the file with the correct field name
      if (profilePic) {
        formData.append('profilePic', profilePic);
      }

      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the correct boundary
        headers: {
          'Accept': 'application/json',
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create an Account
        </h2>

        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center">
          {preview ? (
            <img
              src={preview}
              alt="Profile Preview"
              className="w-28 h-28 rounded-full object-cover mb-3 border"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center mb-3 text-gray-500">
              No Image
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-600 
                       file:mr-4 file:py-2 file:px-4 
                       file:rounded-full file:border-0 
                       file:text-sm file:font-semibold 
                       file:bg-green-50 file:text-green-600 
                       hover:file:bg-green-100"
            required
          />
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold mb-1">Username</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold mb-1">First Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold mb-1">Last Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          {/* Suffix */}
          <div>
            <label className="block text-sm font-semibold mb-1">Suffix</label>
            <select
              className="w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
            >
              <option value="">None</option>
              <option value="Jr.">Jr.</option>
              <option value="Sr.">Sr.</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
              <option value="Other">Other</option>
            </select>

            {suffix === "Other" && (
              <input
                type="text"
                className="mt-2 w-full px-4 py-2 border rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter custom suffix"
                onChange={(e) => setSuffix(e.target.value)}
              />
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold mb-1">Phone Number</label>
            <input
              type="tel"
              pattern="^\+63\s[0-9]{3}\s[0-9]{3}\s[0-9]{4}$"
              title="Format: +63 912 345 6789"
              className="w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+63 912 345 6789"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold mb-1">Role</label>
            <select
              className="w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select a role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-orange-600 text-white 
                     py-3 rounded-lg font-semibold transition shadow-md"
        >
          {loading ? "Signing up..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;

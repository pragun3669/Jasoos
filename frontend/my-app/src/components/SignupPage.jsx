import React, { useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { API_URL } from "../config";

const SignupPage = ({ onNavigate }) => {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email is invalid';

    if (!formData.password)
      newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (!formData.confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= NORMAL SIGNUP =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const payload = {
        username: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
        role: "TEACHER", // ✅ default role
      };

      const res = await axios.post(
        `${API_URL}/api/auth/signup`,
        payload
      );

      if (
        res.status === 200 &&
        typeof res.data === 'string' &&
        res.data.includes('registered successfully')
      ) {
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => onNavigate('login'), 1200);
      } else {
        setIsError(true);
        setMessage('Signup failed!');
      }

    } catch (err) {
      setIsError(true);
      setMessage(
        err.response?.data?.message ||
        err.message ||
        'Signup failed due to server error!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ================= GOOGLE SIGNUP =================
  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/google`,
        { token: credentialResponse.credential }
      );

      if (res.data.success && res.data.user?.token) {
        login(res.data.user, res.data.user.token);
        onNavigate('home');
      } else {
        setIsError(true);
        setMessage('Google signup failed');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Google signup failed!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black py-12 px-4">
      <div className="max-w-md mx-auto">

        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-green-400 to-blue-500 p-3 rounded-xl w-fit mx-auto mb-4 shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create a Teacher Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Join Jasoos:AI and start creating smart proctored exams
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none`}
                  placeholder="First Name"
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none`}
                  placeholder="Last Name"
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none`}
              placeholder="Email Address"
            />
            {errors.email && <p className="text-sm text-red-500 -mt-4">{errors.email}</p>}

            {/* Password */}
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none`}
              placeholder="Password"
            />
            {errors.password && <p className="text-sm text-red-500 -mt-4">{errors.password}</p>}

            {/* Confirm Password */}
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none`}
              placeholder="Confirm Password"
            />
            {errors.confirmPassword && <p className="text-sm text-red-500 -mt-4">{errors.confirmPassword}</p>}

            {message && (
              <p className={`text-center text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Google Signup */}
          <div className="flex justify-center">
            <div className="shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-all">
              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={() => {
                  setIsError(true);
                  setMessage('Google signup failed');
                }}
                theme="outline"
                size="large"
                width="320"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-green-500 hover:text-green-600 font-semibold"
              >
                Sign In
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignupPage;
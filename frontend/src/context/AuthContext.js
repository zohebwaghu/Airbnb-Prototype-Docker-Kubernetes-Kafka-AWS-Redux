import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults (only in browser environment)
  if (typeof window !== 'undefined') {
    // Use environment variable or fallback to relative path for Docker deployment
    axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';
    axios.defaults.withCredentials = true;
  }

  // Check if user is logged in on app start
  useEffect(() => {
    // Only check auth status in browser environment
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      // User not logged in, that's fine
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post('/auth/signup', userData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Logout failed'
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/users/profile', profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Profile update failed'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isTraveler: user?.userType === 'traveler',
    isOwner: user?.userType === 'owner'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import config from '../config';

interface User {
  id: string;
  email: string;
  account_type: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  image?: string;
  // Extend with more fields if needed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    first_name: string,
    last_name: string,
    email: string,
    username: string,
    password: string,
    account_type: string,
    headline?: string,
    summary?: string,
    image?: File,
    gov_certificate?: File
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${config.API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('account_type');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ✅ Updated login method to fetch full user profile
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/login`, {
        email,
        password
      });

      const { token, account_type } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('account_type', account_type);

      // ✅ Fetch full user profile after login
      const meRes = await axios.get(`${config.API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(meRes.data);
      return { success: true };
    } catch (error) {
      console.error('Login Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  };

  const signup = async (
    first_name: string,
    last_name: string,
    email: string,
    username: string,
    password: string,
    account_type: string,
    headline?: string,
    summary?: string,
    image?: File,
    gov_certificate?: File
  ) => {
    try {
      const formData = new FormData();
      formData.append('first_name', first_name);
      formData.append('last_name', last_name);
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);
      formData.append('account_type', account_type);
      if (headline) formData.append('headline', headline);
      if (summary) formData.append('summary', summary);
      if (image) formData.append('image', image);
      if (gov_certificate) formData.append('gov_certificate', gov_certificate);

      const response = await axios.post(`${config.API_BASE_URL}/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('account_type', user.account_type);
      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('account_type');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

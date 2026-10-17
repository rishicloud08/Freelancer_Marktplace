import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('freelancehub_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.auth.getMe();
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('freelancehub_user', JSON.stringify(res.data));
        }
      } catch (error) {
        console.error('Error fetching user', error);
        // Only clear credentials if the backend explicitly rejects the token as invalid or expired (401)
        // Do NOT log out on network timeouts, 502/503 (Render cold starts)
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('freelancehub_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.auth.login({ email, password });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      }
      if (res.data?.user) {
        localStorage.setItem('freelancehub_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
      }
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const res = await api.auth.register(data);
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      }
      if (res.data?.user) {
        localStorage.setItem('freelancehub_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
      }
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('freelancehub_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.auth.updateProfile(data);
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('freelancehub_user', JSON.stringify(res.data));
      }
      toast.success('Profile updated and saved!');
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
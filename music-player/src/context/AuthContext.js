// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import authAPI from "../api/authAPI";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await authAPI.getMe();
          // ✅ getMe trả về res.data.data
          const userData = res.data.data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (error) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const register = async (username, email, password) => {
    const res = await authAPI.register({ username, email, password });

    // ✅ Fix: kiểm tra cả 2 format
    const resData = res.data.data || res.data;
    const { token, ...userData } = resData;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return res;
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });

    // ✅ Fix: kiểm tra cả 2 format
    const resData = res.data.data || res.data;
    const { token, ...userData } = resData;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return res;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  const refreshUser = async () => {
    try {
      const res      = await authAPI.getMe();
      const userData = res.data.data || res.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
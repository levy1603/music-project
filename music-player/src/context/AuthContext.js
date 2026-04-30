// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authAPI from "../api/authAPI";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const extractPayload = (response) => response?.data || response;

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  /* ── Check auth khi app khởi động ── */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res      = await authAPI.getMe();
        const userData = extractPayload(res);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /* ── Register ── */
  const register = useCallback(async (username, email, password) => {
    const res             = await authAPI.register({ username, email, password });
    const resData         = extractPayload(res);
    const { token, ...userData } = resData;

    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(userData));
    setUser(userData);
    return res;
  }, []);

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    const res             = await authAPI.login({ email, password });
    const resData         = extractPayload(res);
    const { token, ...userData } = resData;

    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(userData));
    setUser(userData);
    return res;
  }, []);

  /* ── Logout ── */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  /* ── Update user ── */
  const updateUser = useCallback((newUserData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  /* ── Refresh từ server ── */
  const refreshUser = useCallback(async () => {
    try {
      const res      = await authAPI.getMe();
      const userData = extractPayload(res);

      setUser((prev) => {
        if (prev?.avatarUpdatedAt && userData?.avatarUpdatedAt) {
          if (prev.avatarUpdatedAt > userData.avatarUpdatedAt) {
            return { ...userData, avatar: prev.avatar };
          }
        }
        return userData;
      });

      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  }, []);

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
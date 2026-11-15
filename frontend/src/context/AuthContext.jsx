"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

/**
 * ARCHITECTURAL SECURITY NOTE (LocalStorage vs httpOnly Cookies):
 * Storing JWT access tokens in localStorage simplifies mobile browser and hybrid PWA execution
 * without requiring cross-origin cookie relay or specialized CSRF anti-forgery synchronizer tokens.
 * However, localStorage is accessible to client scripts and vulnerable to XSS if inputs are unescaped;
 * whereas httpOnly cookies prevent script access at the cost of requiring CSRF protection and domain proxying.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("krishi_token");
      const storedUser = localStorage.getItem("krishi_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load auth credentials from storage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (phone, password) => {
    const data = await api.post("/auth/login", { phone, password });
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("krishi_token", data.access_token);
    localStorage.setItem("krishi_user", JSON.stringify(data.user));
    return data.user;
  };

  const demoLogin = async () => {
    const data = await api.post("/auth/demo-login", {});
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("krishi_token", data.access_token);
    localStorage.setItem("krishi_user", JSON.stringify(data.user));
    return data.user;
  };

  const signup = async (signupData) => {
    const newUser = await api.post("/auth/signup", signupData);
    // Automatically log in upon successful registration
    return await login(signupData.phone, signupData.password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("krishi_token");
    localStorage.removeItem("krishi_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

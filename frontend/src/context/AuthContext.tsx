"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage on mount
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    // Allow sso-login route to bypass protection
    if (pathname === "/sso-login") {
      return;
    }

    if (!token) {
      // If not logged in and not on sso-login, show an unauthorized screen or redirect
      // We don't want to redirect them to the hub immediately to avoid infinite loops,
      // but we can block the UI.
    }
  }, [token, pathname, loading]);

  const login = (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    window.location.href = "http://localhost:3000"; // Redirect to hub
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;

  // Protect the routes unless it's sso-login
  if (!token && pathname !== "/sso-login") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Access Denied</h1>
        <p className="text-slate-400">You must log in via the QuickTrack Hub.</p>
        <a href="http://localhost:3000" className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-400 transition-colors">
          Return to Hub
        </a>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

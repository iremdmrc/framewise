import { useState, useEffect } from "react";
import { api } from "../services/api";

/**
 * Simple auth hook — reads JWT from memory / localStorage.
 * Teammate: wire this up to your login UI.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fw_token");
    if (!token) { setLoading(false); return; }

    api.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("fw_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("fw_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("fw_token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return { user, loading, login, logout };
}

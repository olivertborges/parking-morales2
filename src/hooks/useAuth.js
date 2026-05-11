// src/hooks/useAuth.js
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setIsAdmin(parsed?.rol === "Admin");
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    setLoading(false);
  }, []);

  return { user, isAdmin, loading };
}
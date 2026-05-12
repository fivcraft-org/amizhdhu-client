// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { authProfile } from "../api/auth/auth";
import { useLocation } from "react-router-dom";
import ROUTES from "../utils/routes/routes";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const {
    LOGIN,
    LANDING,
    VERIFY_OTP,
    FORGOT_PIN,
    RESET_PIN,
    CREATE_PIN,
  } = ROUTES;

  const PUBLIC_ROUTES = [
    LOGIN,
    LANDING,
    VERIFY_OTP,
    FORGOT_PIN,
    RESET_PIN,
    CREATE_PIN,
  ];

  const refreshUser = async () => {
    try {
      const res = await authProfile();
      setUser(res.data.data.user);
      return res.data.data.user;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    if (PUBLIC_ROUTES.includes(location.pathname)) {
      setLoading(false);
      return;
    }

    // Only skip if user exists AND has core profile fields (like employeeId)
    if (user && user.employeeId) {
      setLoading(false);
      return;
    }

    authProfile()
      .then((res) => {
        if (mounted) {
          setUser(res.data.data.user);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname, user?.employeeId]); // Depend on employeeId to trigger if missing

  const logout = () => {
    setUser(null);
    sessionStorage.clear();
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

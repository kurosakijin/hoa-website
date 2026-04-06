import { createContext, useContext, useEffect, useState } from 'react';
import { getAdminProfile, loginAdmin } from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'hoa-admin-session';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(STORAGE_KEY);

    if (!savedToken) {
      setReady(true);
      return;
    }

    getAdminProfile(savedToken)
      .then((data) => {
        setToken(savedToken);
        setAdmin(data.admin);
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  async function login(credentials) {
    const data = await loginAdmin(credentials);
    setToken(data.token);
    setAdmin(data.admin);
    window.localStorage.setItem(STORAGE_KEY, data.token);
    return data;
  }

  function logout() {
    setToken(null);
    setAdmin(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        admin,
        ready,
        isAuthenticated: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}

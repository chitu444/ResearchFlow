import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rf_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('rf_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const payload = {
      ...credentials,
      email: String(credentials.email || '').trim().toLowerCase(),
    };
    const r = await api.post('/auth/login', payload);
    localStorage.setItem('rf_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('rf_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

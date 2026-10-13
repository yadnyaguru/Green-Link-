import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('greenlink_user')) || null;
    } catch {
      return null;
    }
  });

  // Keep local user profile (like isProvider) synchronized with database
  useEffect(() => {
    const token = localStorage.getItem('greenlink_token');
    if (token) {
      api.get('/users/profile')
        .then(({ data }) => {
          if (data && data._id) {
            setUser((prev) => {
              const merged = { ...prev, ...data };
              localStorage.setItem('greenlink_user', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem('greenlink_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('greenlink_user');
    localStorage.removeItem('greenlink_token');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('greenlink_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

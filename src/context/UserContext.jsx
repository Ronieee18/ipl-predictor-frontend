import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { joinUser } from '../api.js';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ipl_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('ipl_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ipl_user');
  };

  const updateScore = (delta) => {
    if (!user) return;
    const updated = {
      ...user,
      totalScore: (user.totalScore || 0) + delta,
    };
    setUser(updated);
    localStorage.setItem('ipl_user', JSON.stringify(updated));
  };

  const refreshUser = useCallback(async () => {
    if (!user?.username) return;
    try {
      const refreshed = await joinUser(user.username);
      login(refreshed);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  }, [user?.username]);

  return (
    <UserContext.Provider value={{ user, login, logout, updateScore, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
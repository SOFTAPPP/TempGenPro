import React, { createContext, useContext, useState, useEffect } from 'react';
import { socketService } from '../services/socket';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
  }, []);

  // ⚡ Universal Kick Monitor (Ban or Deletion)
  useEffect(() => {
    if (user) {
      console.log(`[Socket] 🔗 Context connecting for user: ${user.id}`);
      socketService.connect();
      socketService.joinUser(user.id);

      const handleBan = (data: { message: string }) => {
        console.log(`[Socket] 🚨 BAN SIGNAL RECEIVED:`, data);
        window.location.href = '/suspended';
      };

      const handleRestore = (data: { message: string }) => {
        console.log(`[Socket] 🟢 RESTORE SIGNAL RECEIVED:`, data);
        window.location.href = '/inbox';
      };

      const handleDelete = (data: { message: string }) => {
        console.log(`[Socket] 🗑️ DELETE SIGNAL RECEIVED:`, data);
        logout();
        window.location.href = '/deleted';
      };

      socketService.on('user_banned', handleBan);
      socketService.on('user_restored', handleRestore);
      socketService.on('user_deleted', handleDelete);

      return () => {
        console.log(`[Socket] 📵 Cleaning up listeners...`);
        socketService.off('user_banned');
        socketService.off('user_restored');
        socketService.off('user_deleted');
      };
    }
  }, [user]);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setToken(token);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    socketService.disconnect();
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

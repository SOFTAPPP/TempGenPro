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
  const checkExternalNavigation = () => {
    try {
      const navEntries = performance.getEntriesByType("navigation");
      if (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "back_forward") {
        return true;
      }
    } catch (e) {}
    return false;
  };

  const [user, setUser] = useState<User | null>(() => {
    if (checkExternalNavigation()) {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      return null;
    }
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    if (checkExternalNavigation()) return null;
    return sessionStorage.getItem('token');
  });

  // Handle BFCache (Back-Forward Cache) restoration
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // The page was restored from the browser's Back/Forward cache (external navigation)
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        setUser(null);
        setToken(null);
        window.location.replace('/login');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
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

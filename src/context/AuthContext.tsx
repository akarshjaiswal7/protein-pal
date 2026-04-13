import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  userId: string | null;
  username: string | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (userId: string, username: string, token: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');

    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(storedUserId);
      setUsername(storedUsername);
      setRole(storedRole || 'User');
    }
  }, []);

  const login = (id: string, name: string, jwt: string, userRole: string) => {
    setUserId(id);
    setUsername(name);
    setToken(jwt);
    setRole(userRole);
    localStorage.setItem('userId', id);
    localStorage.setItem('username', name);
    localStorage.setItem('token', jwt);
    localStorage.setItem('role', userRole);
  };

  const logout = () => {
    setUserId(null);
    setUsername(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('onboardingComplete');
    localStorage.removeItem('proteinGoal');
  };

  return (
    <AuthContext.Provider value={{ userId, username, token, role, isAuthenticated: !!token, login, logout }}>
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

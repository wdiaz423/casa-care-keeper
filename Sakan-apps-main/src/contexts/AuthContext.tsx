import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '@/api/client';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (token && stored) {
      try {
        const u = JSON.parse(stored) as AuthUser;
        setUser(u);
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

 /* const signIn = async (email: string, password: string) => {
    const res = await api.post('/api/users/login', { email, password });
    if (res?.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser({ id: String(res.user.id), email: res.user.email });
    } else {
      throw new Error('Invalid login response');
    }
  };*/

const signIn = async (email: string, password: string) => {
  const res = await api.post('/api/users/login', { email, password });
  if (res?.token) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    
    setUser({ 
      id: String(res.user.id), 
      email: res.user.email,
      name: res.user.name,
      avatarUrl: res.user.avatarUrl
    });
  } else {
    throw new Error('Invalid login response');
  }
};


  const signUp = async (email: string, password: string, name?: string) => {
    // create user then auto-login
    await api.post('/api/users', { email, password, name });
    await signIn(email, password);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'ft_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state
  useEffect(() => {
    let subscription: any = null;

    const initializeAuth = async () => {
      if (isSupabaseConfigured) {
        // Check active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name,
          });
        }
        setLoading(false);

        // Subscribe to Supabase Auth state changes
        const { data } = supabase.auth.onAuthStateChange(
          async (event: any, session: any) => {
            if (session?.user) {
              const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name,
              });
            } else {
              setUser(null);
            }
            setLoading(false);
          }
        );
        subscription = data.subscription;
      } else {
        // Local Fallback: load user session if any
        try {
          const storedUser = await AsyncStorage.getItem(LOCAL_USER_KEY);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (e) {
          console.error('Error loading local user:', e);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: error.message };
        return { error: null };
      } else {
        // Local Mock Login
        const mockUser: AuthUser = {
          id: 'local-user-id',
          email: email.toLowerCase(),
          name: email.split('@')[0],
        };
        await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        return { error: null };
      }
    } catch (e: any) {
      return { error: e.message || 'An error occurred during sign in.' };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) return { error: error.message };
        return { error: null };
      } else {
        // Local Mock Signup
        const mockUser: AuthUser = {
          id: 'local-user-id',
          email: email.toLowerCase(),
          name,
        };
        await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        return { error: null };
      }
    } catch (e: any) {
      return { error: e.message || 'An error occurred during sign up.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      } else {
        await AsyncStorage.removeItem(LOCAL_USER_KEY);
      }
      setUser(null);
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

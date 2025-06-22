import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
};

export type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData?: Partial<User>) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  session: null,
  user: null,
  loading: true,
  error: null,
  isAdmin: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  // Transform Supabase user to our User type
  const transformUser = useCallback(async (user: SupabaseUser | null): Promise<User | null> => {
    if (!user) return null;
    
    // Get additional user data from your profiles table if needed
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', error);
    }

    return {
      id: user.id,
      email: user.email || '',
      role: profile?.role || 'user',
      created_at: user.created_at,
      updated_at: user.updated_at,
      ...profile,
    };
  }, []);

  // Update auth state
  const updateAuthState = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({
        session: null,
        user: null,
        loading: false,
        error: null,
        isAdmin: false,
      });
      return null;
    }

    try {
      const user = await transformUser(session.user);
      const isAdmin = user?.role === 'admin';
      
      setState({
        session,
        user,
        loading: false,
        error: null,
        isAdmin,
      });
      
      return user;
    } catch (error) {
      console.error('Error updating auth state:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to update auth state'),
        loading: false,
        isAdmin: false,
      }));
      return null;
    }
  }, [transformUser]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to sign in');
      setState(prev => ({ ...prev, error: authError }));
      return { error: authError as AuthError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, userData?: Partial<User>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
            email_confirm: true, // Set to false if you want to verify emails
          },
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to sign up');
      setState(prev => ({ ...prev, error: authError }));
      return { error: authError as AuthError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to sign out');
      setState(prev => ({ ...prev, error: authError }));
      return { error: authError as AuthError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to reset password');
      setState(prev => ({ ...prev, error: authError }));
      return { error: authError as AuthError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await updateAuthState(session);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error : new Error('Failed to initialize auth'),
          loading: false,
          isAdmin: false,
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          await updateAuthState(session);
          
          // Handle navigation based on auth events
          if (event === 'SIGNED_IN') {
            navigate('/dashboard');
          } else if (event === 'SIGNED_OUT') {
            navigate('/');
          }
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            loading: false,
            isAdmin: false,
          }));
          if (event === 'SIGNED_OUT') {
            navigate('/');
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, updateAuthState]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
    ...state,
    isAuthenticated: !!state.session,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [state, signIn, signUp, signOut, resetPassword]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

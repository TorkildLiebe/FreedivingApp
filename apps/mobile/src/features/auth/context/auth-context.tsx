import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/src/infrastructure/supabase/client';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const autoLoginEmail = process.env.EXPO_PUBLIC_AUTO_LOGIN_EMAIL;
  const autoLoginPassword = process.env.EXPO_PUBLIC_AUTO_LOGIN_PASSWORD;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (
        !session &&
        autoLoginEmail &&
        autoLoginPassword &&
        process.env.NODE_ENV === 'development'
      ) {
        const { data } = await supabase.auth.signInWithPassword({
          email: autoLoginEmail,
          password: autoLoginPassword,
        });
        setSession(data.session);
      } else {
        setSession(session);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [autoLoginEmail, autoLoginPassword]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, isLoading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

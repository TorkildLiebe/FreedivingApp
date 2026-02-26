import React, { createContext, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/src/infrastructure/supabase/client';

interface SignUpInput {
  alias: string;
  email: string;
  password: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signUp: (input: SignUpInput) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const autoLoginEmail = process.env.EXPO_PUBLIC_AUTO_LOGIN_EMAIL;
  const autoLoginPassword = process.env.EXPO_PUBLIC_AUTO_LOGIN_PASSWORD;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (
        !currentSession &&
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
        setSession(currentSession);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, [autoLoginEmail, autoLoginPassword]);

  const signUp = async ({ alias, email, password, avatarUrl }: SignUpInput) => {
    const trimmedAlias = alias.trim();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          alias: trimmedAlias,
          avatarUrl: avatarUrl ?? null,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URL,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    if (data?.url) {
      await Linking.openURL(data.url);
    }

    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL,
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

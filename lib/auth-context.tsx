import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// APIリクエストにAuthorizationヘッダーを自動で追加するヘルパー関数
export const createAuthenticatedFetch = (session: Session | null) => {
  return async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (session?.access_token) {
      (headers as any)['Authorization'] = `Bearer ${session.access_token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data?: { user: User | null; session: Session | null };
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data?: { user: User | null; session: Session | null };
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  updatePassword: (password: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 一時的にローディングを無効にして、NextAuthがなくても動作するようにする
    setIsLoading(false);
    
    // TODO: Supabaseの設定が完了したら、以下のコードを有効にする
    /*
    // セッションの初期化と監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    // 初期セッションの取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    // クリーンアップ関数
    return () => {
      subscription.unsubscribe();
    };
    */
  }, []);

  // サインイン関数
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  // サインアップ関数
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      // ユーザー設定を初期化するためのAPIを呼び出す
      if (data.user) {
        await fetch('/api/user/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: data.user.id }),
        });
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  // サインアウト関数
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // パスワードリセット関数
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as Error, data: null };
    }
  };

  // パスワード更新関数
  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as Error, data: null };
    }
  };

  const authenticatedFetch = createAuthenticatedFetch(session);

  const value = {
    user,
    session,
    isLoading,
    authenticatedFetch,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sdk } from '../lib/sdk';
import type { User } from '../../../../packages/sdk/src/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (newEmail: string, password: string) => Promise<void>;
  updateSettings: (theme?: 'SYSTEM' | 'LIGHT' | 'DARK', language?: 'JA' | 'EN') => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@rss_reader_token';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        sdk.setToken(token);
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Failed to load stored token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await sdk.auth.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      await AsyncStorage.removeItem(TOKEN_KEY);
      sdk.clearToken();
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt:', { email });
      const response = await sdk.auth.login({ email, password });
      console.log('Login response:', response);
      
      const { token, user: userData } = response;
      
      await AsyncStorage.setItem(TOKEN_KEY, token);
      sdk.setToken(token);
      setUser(userData);
      
      console.log('Login successful, user set:', userData);
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await sdk.auth.register({ email, password, name });
    const { token, user: userData } = response;
    
    await AsyncStorage.setItem(TOKEN_KEY, token);
    sdk.setToken(token);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    sdk.clearToken();
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    await sdk.auth.forgotPassword({ email });
  };

  const resetPassword = async (token: string, password: string) => {
    await sdk.auth.resetPassword({ token, password });
  };

  const updateProfile = async (name: string) => {
    const updatedUser = await sdk.auth.updateUser({ name });
    setUser(updatedUser);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await sdk.auth.changePassword({ currentPassword, newPassword });
  };

  const changeEmail = async (newEmail: string, password: string) => {
    await sdk.auth.changeEmail({ newEmail, password });
    await loadUserProfile(); // メールアドレスが更新されたらプロフィールを再読み込み
  };

  const updateSettings = async (theme?: 'SYSTEM' | 'LIGHT' | 'DARK', language?: 'JA' | 'EN') => {
    const updatedUser = await sdk.auth.updateSettings({ theme, language });
    setUser(updatedUser);
  };

  const deleteAccount = async () => {
    await sdk.auth.deleteAccount();
    await logout();
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    changeEmail,
    updateSettings,
    deleteAccount,
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
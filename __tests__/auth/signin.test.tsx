import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignIn from '../../pages/auth/signin';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// AuthContextのモック
vi.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
  }),
}));

// i18nextのモック
vi.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        title: 'Sign In',
        titleSignUp: 'Sign Up',
        email: 'Email',
        password: 'Password',
        emailValidation: 'Please enter a valid email',
        passwordValidation: 'Password must be at least 8 characters',
        forgotPassword: 'Forgot password?',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        processing: 'Processing...',
        register: 'Register',
        login: 'Login',
        createAccount: 'Create an account',
        alreadyHaveAccount: 'Already have an account? ',
        dontHaveAccount: 'Don\'t have an account? ',
        confirmEmail: 'Please confirm your email',
        signupError: 'Error during signup',
        signinError: 'Invalid email or password',
      };
      return translations[key] || key;
    },
  }),
}));

// Next.jsのrouterのモック
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    query: {},
  }),
}));

// serverSideTranslationsのモック
vi.mock('next-i18next/serverSideTranslations', () => ({
  serverSideTranslations: vi.fn().mockResolvedValue({}),
}));

describe('SignIn Page', () => {
  let signInMock: Mock;
  let signUpMock: Mock;
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    const { useAuth } = require('../../lib/auth-context');
    signInMock = useAuth().signIn;
    signUpMock = useAuth().signUp;
    
    signInMock.mockReset();
    signUpMock.mockReset();
    
    // 成功レスポンスの設定
    signInMock.mockResolvedValue({ error: null });
    signUpMock.mockResolvedValue({ 
      error: null, 
      data: { user: { id: '123' } } 
    });
    
    user = userEvent.setup();
  });

  it('renders sign in form by default', () => {
    render(<SignIn />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('switches to sign up form when clicking "Sign Up" button', async () => {
    render(<SignIn />);
    
    // サインアップへの切り替え
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));
    
    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<SignIn />);
    
    // 無効なメールアドレスを入力
    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // バリデーションエラーが表示される
    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    
    // サインインは呼ばれない
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    render(<SignIn />);
    
    // 短すぎるパスワードを入力
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // バリデーションエラーが表示される
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    
    // サインインは呼ばれない
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('calls signIn with correct credentials', async () => {
    render(<SignIn />);
    
    // 有効な認証情報を入力
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // サインインが正しい認証情報で呼ばれる
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('calls signUp with correct credentials', async () => {
    render(<SignIn />);
    
    // サインアップフォームに切り替え
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));
    
    // 有効な認証情報を入力
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Register' }));
    
    // サインアップが正しい認証情報で呼ばれる
    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message when sign in fails', async () => {
    // サインイン失敗のモック
    signInMock.mockResolvedValueOnce({ 
      error: new Error('Invalid email or password') 
    });
    
    render(<SignIn />);
    
    // 認証情報を入力
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
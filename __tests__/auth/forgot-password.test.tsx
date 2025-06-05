import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../../pages/auth/forgot-password';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// AuthContextのモック
vi.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    resetPassword: vi.fn(),
  }),
}));

// i18nextのモック
vi.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        title: 'Reset Password',
        heading: 'Forgot your password?',
        subtitle: 'Enter your email address and we\'ll send you a link to reset your password.',
        email: 'Email',
        emailValidation: 'Please enter a valid email',
        sendResetLink: 'Send Reset Link',
        processing: 'Processing...',
        resetLinkSent: 'Reset link has been sent to your email',
        backToLogin: 'Back to login',
        resetRequestFailed: 'Failed to send reset link',
      };
      return translations[key] || key;
    },
  }),
}));

// serverSideTranslationsのモック
vi.mock('next-i18next/serverSideTranslations', () => ({
  serverSideTranslations: vi.fn().mockResolvedValue({}),
}));

describe('ForgotPassword Page', () => {
  let resetPasswordMock: Mock;
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    const { useAuth } = require('../../lib/auth-context');
    resetPasswordMock = useAuth().resetPassword;
    
    resetPasswordMock.mockReset();
    resetPasswordMock.mockResolvedValue({ error: null, data: {} });
    
    user = userEvent.setup();
  });

  it('renders forgot password form', () => {
    render(<ForgotPassword />);
    
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
    expect(screen.getByText('Back to login')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<ForgotPassword />);
    
    // 無効なメールアドレスを入力
    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    
    // バリデーションエラーが表示される
    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    
    // パスワードリセットは呼ばれない
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('calls resetPassword with correct email', async () => {
    render(<ForgotPassword />);
    
    // 有効なメールアドレスを入力
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    
    // パスワードリセットが正しいメールアドレスで呼ばれる
    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after successful reset request', async () => {
    render(<ForgotPassword />);
    
    // 有効なメールアドレスを入力して送信
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    
    // 成功メッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('Reset link has been sent to your email')).toBeInTheDocument();
    });
    
    // フォームが表示されなくなる
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('displays error message when reset request fails', async () => {
    // パスワードリセット失敗のモック
    resetPasswordMock.mockResolvedValueOnce({ 
      error: new Error('Failed to send reset link'), 
      data: null 
    });
    
    render(<ForgotPassword />);
    
    // メールアドレスを入力して送信
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    
    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('Failed to send reset link')).toBeInTheDocument();
    });
    
    // フォームは引き続き表示される
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows loading state during processing', async () => {
    // 遅延するレスポンスのモック
    resetPasswordMock.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ error: null, data: {} });
        }, 100);
      });
    });
    
    render(<ForgotPassword />);
    
    // メールアドレスを入力して送信
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    
    // ボタンがロード中のテキストを表示
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeInTheDocument();
    
    // 完了後、成功メッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('Reset link has been sent to your email')).toBeInTheDocument();
    });
  });
});
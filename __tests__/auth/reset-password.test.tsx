import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPassword from '../../pages/auth/reset-password';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// AuthContextのモック
vi.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    updatePassword: vi.fn(),
  }),
}));

// i18nextのモック
vi.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        resetPasswordTitle: 'Reset Password',
        setNewPassword: 'Set New Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        passwordMinLength: 'Password must be at least 8 characters',
        passwordMismatch: 'Passwords do not match',
        updatePassword: 'Update Password',
        processing: 'Processing...',
        passwordResetSuccess: 'Password has been reset successfully. Redirecting to login...',
        passwordResetFailed: 'Failed to reset password',
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

// windowのlocationハッシュをモック
const mockLocationHash = (hash: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      hash,
    },
    writable: true,
  });
};

describe('ResetPassword Page', () => {
  let updatePasswordMock: Mock;
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    const { useAuth } = require('../../lib/auth-context');
    updatePasswordMock = useAuth().updatePassword;
    
    updatePasswordMock.mockReset();
    updatePasswordMock.mockResolvedValue({ error: null, data: {} });
    
    // Supabaseからのリダイレクトでハッシュを含むURLをモック
    mockLocationHash('#access_token=test-token&type=recovery');
    
    user = userEvent.setup();
    
    // タイマーをモック
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders password reset form', () => {
    render(<ResetPassword />);
    
    expect(screen.getByText('Set New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
  });

  it('validates password length', async () => {
    render(<ResetPassword />);
    
    // 短すぎるパスワードを入力
    await user.type(screen.getByLabelText('New Password'), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Update Password' }));
    
    // バリデーションエラーが表示される
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    
    // パスワード更新は呼ばれない
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it('validates password match', async () => {
    render(<ResetPassword />);
    
    // 一致しないパスワードを入力
    await user.type(screen.getByLabelText('New Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different123');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Update Password' }));
    
    // バリデーションエラーが表示される
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    
    // パスワード更新は呼ばれない
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it('calls updatePassword with correct password', async () => {
    render(<ResetPassword />);
    
    // 有効なパスワードを入力
    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123');
    
    // フォーム送信
    await user.click(screen.getByRole('button', { name: 'Update Password' }));
    
    // パスワード更新が正しいパスワードで呼ばれる
    await waitFor(() => {
      expect(updatePasswordMock).toHaveBeenCalledWith('newpassword123');
    });
  });

  it('shows success message after successful password update', async () => {
    render(<ResetPassword />);
    
    // 有効なパスワードを入力して送信
    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Update Password' }));
    
    // 成功メッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('Password has been reset successfully. Redirecting to login...')).toBeInTheDocument();
    });
    
    // フォームが表示されなくなる
    expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument();
  });

  it('displays error message when password update fails', async () => {
    // パスワード更新失敗のモック
    updatePasswordMock.mockResolvedValueOnce({ 
      error: new Error('Failed to reset password'), 
      data: null 
    });
    
    render(<ResetPassword />);
    
    // パスワードを入力して送信
    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Update Password' }));
    
    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('Failed to reset password')).toBeInTheDocument();
    });
    
    // フォームは引き続き表示される
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
  });

  it('redirects to login page after successful reset', async () => {
    const { useRouter } = require('next/router');
    const pushMock = useRouter().push;
    
    render(<ResetPassword />);
    
    // パスワードを入力して送信
    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Update Password' }));
    
    // タイマーを進める
    vi.advanceTimersByTime(3000);
    
    // ログインページにリダイレクト
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/auth/signin');
    });
  });
});
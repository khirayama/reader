import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../lib/auth-context';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// Supabaseのモック
vi.mock('../../lib/supabase', () => {
  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({}),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  };

  return {
    supabase: { auth: mockAuth },
  };
});

// Next.jsのrouterのモック
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// テスト用のコンポーネント
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{auth.isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{auth.user ? 'user exists' : 'no user'}</div>
      <button 
        data-testid="signin"
        onClick={() => auth.signIn('test@example.com', 'password')}
      >
        Sign In
      </button>
      <button 
        data-testid="signup"
        onClick={() => auth.signUp('test@example.com', 'password')}
      >
        Sign Up
      </button>
      <button 
        data-testid="signout"
        onClick={() => auth.signOut()}
      >
        Sign Out
      </button>
      <button 
        data-testid="reset"
        onClick={() => auth.resetPassword('test@example.com')}
      >
        Reset Password
      </button>
      <button 
        data-testid="update"
        onClick={() => auth.updatePassword('newpassword')}
      >
        Update Password
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  let signInMock: Mock;
  let signUpMock: Mock;
  let signOutMock: Mock;
  let resetPasswordMock: Mock;
  let updatePasswordMock: Mock;
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    // Supabaseのメソッドをリセット
    const { supabase } = require('../../lib/supabase');
    signInMock = supabase.auth.signInWithPassword as Mock;
    signUpMock = supabase.auth.signUp as Mock;
    signOutMock = supabase.auth.signOut as Mock;
    resetPasswordMock = supabase.auth.resetPasswordForEmail as Mock;
    updatePasswordMock = supabase.auth.updateUser as Mock;
    
    signInMock.mockReset();
    signUpMock.mockReset();
    signOutMock.mockReset();
    resetPasswordMock.mockReset();
    updatePasswordMock.mockReset();
    
    user = userEvent.setup();
  });

  it('provides auth context and initial loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // 初期状態はロード中
    expect(screen.getByTestId('loading').textContent).toBe('loading');
    
    // ロード完了後
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('loaded');
    });
    
    // ユーザーは存在しない（初期状態）
    expect(screen.getByTestId('user').textContent).toBe('no user');
  });

  it('handles sign in', async () => {
    signInMock.mockResolvedValueOnce({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token' },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('loaded');
    });

    // サインインボタンをクリック
    await user.click(screen.getByTestId('signin'));

    // Supabaseのサインインメソッドが呼ばれたか確認
    expect(signInMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles sign up', async () => {
    // モックの実装
    signUpMock.mockResolvedValueOnce({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: null
      },
      error: null,
    });

    // Fetchモックの設定（ユーザー初期化API）
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('loaded');
    });

    // サインアップボタンをクリック
    await user.click(screen.getByTestId('signup'));

    // Supabaseのサインアップメソッドが呼ばれたか確認
    expect(signUpMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });

    // ユーザー初期化APIが呼ばれたか確認
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/initialize',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '123' }),
      })
    );
  });

  it('handles sign out', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('loaded');
    });

    // サインアウトボタンをクリック
    await user.click(screen.getByTestId('signout'));

    // Supabaseのサインアウトメソッドが呼ばれたか確認
    expect(signOutMock).toHaveBeenCalled();
  });

  it('handles password reset', async () => {
    resetPasswordMock.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('loaded');
    });

    // パスワードリセットボタンをクリック
    await user.click(screen.getByTestId('reset'));

    // パスワードリセットが呼ばれたか確認
    expect(resetPasswordMock).toHaveBeenCalledWith('test@example.com', {
      redirectTo: expect.any(String),
    });
  });

  it('handles password update', async () => {
    updatePasswordMock.mockResolvedValueOnce({
      data: { user: { id: '123' } },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('loaded');
    });

    // パスワード更新ボタンをクリック
    await user.click(screen.getByTestId('update'));

    // パスワード更新が呼ばれたか確認
    expect(updatePasswordMock).toHaveBeenCalledWith({ password: 'newpassword' });
  });
});
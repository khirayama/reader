import type { ApiClient } from './client';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ChangeEmailRequest,
  UpdateSettingsRequest,
  UpdateUserRequest,
} from './types';

export class AuthService {
  constructor(private client: ApiClient) {}

  // ユーザー登録
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/auth/register', data);
    
    if (response.success && response.data) {
      // 自動的にトークンを設定
      this.client.setToken(response.data.token);
      return response.data;
    }
    
    throw new Error(response.error || '登録に失敗しました');
  }

  // ログイン
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/auth/login', data);
    
    if (response.success && response.data) {
      // 自動的にトークンを設定
      this.client.setToken(response.data.token);
      return response.data;
    }
    
    throw new Error(response.error || 'ログインに失敗しました');
  }

  // ログアウト
  logout(): void {
    this.client.clearToken();
  }

  // パスワードリセット要求
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const response = await this.client.post('/api/auth/forgot-password', data);
    
    if (!response.success) {
      throw new Error(response.error || 'パスワードリセット要求に失敗しました');
    }
  }

  // パスワードリセット実行
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const response = await this.client.post('/api/auth/reset-password', data);
    
    if (!response.success) {
      throw new Error(response.error || 'パスワードリセットに失敗しました');
    }
  }

  // ユーザープロフィール取得
  async getProfile(): Promise<User> {
    const response = await this.client.get<User>('/api/auth/profile');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'プロフィールの取得に失敗しました');
  }

  // パスワード変更
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await this.client.put('/api/auth/password', data);
    
    if (!response.success) {
      throw new Error(response.error || 'パスワード変更に失敗しました');
    }
  }

  // メールアドレス変更
  async changeEmail(data: ChangeEmailRequest): Promise<void> {
    const response = await this.client.put('/api/auth/email', data);
    
    if (!response.success) {
      throw new Error(response.error || 'メールアドレス変更に失敗しました');
    }
  }

  // ユーザー設定更新
  async updateSettings(data: UpdateSettingsRequest): Promise<User> {
    const response = await this.client.put<User>('/api/auth/settings', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || '設定の更新に失敗しました');
  }

  // ユーザー情報更新
  async updateUser(data: UpdateUserRequest): Promise<User> {
    const response = await this.client.put<User>('/api/auth/profile', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'ユーザー情報の更新に失敗しました');
  }

  // アカウント削除
  async deleteAccount(): Promise<void> {
    const response = await this.client.delete('/api/auth/account');
    
    if (response.success) {
      // アカウント削除後はトークンをクリア
      this.client.clearToken();
    } else {
      throw new Error(response.error || 'アカウント削除に失敗しました');
    }
  }

  // 認証状態確認
  isAuthenticated(): boolean {
    return !!this.client.getToken();
  }
}
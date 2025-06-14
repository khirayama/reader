import type { ApiClient } from './client'
import type {
  ChangeEmailRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateSettingsRequest,
  UpdateUserRequest,
  User,
} from './types'

export class AuthService {
  constructor(private client: ApiClient) {}

  // ユーザー登録
  async register(data: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/api/auth/register', data)
      console.log('Auth service register response:', response)

      // APIサーバーは直接 { user, token } を返すので、responseがLoginResponseです
      if (response?.token && response.user) {
        // 自動的にトークンを設定
        this.client.setToken(response.token)
        return response
      }

      throw new Error('無効なレスポンス形式です')
    } catch (error) {
      console.error('Auth service register error:', error)
      throw error
    }
  }

  // ログイン
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/api/auth/login', data)
      console.log('Auth service login response:', response)

      // APIサーバーは直接 { user, token } を返すので、responseがLoginResponseです
      if (response?.token && response.user) {
        // 自動的にトークンを設定
        this.client.setToken(response.token)
        return response
      }

      throw new Error('無効なレスポンス形式です')
    } catch (error) {
      console.error('Auth service login error:', error)
      throw error
    }
  }

  // ログアウト
  logout(): void {
    this.client.clearToken()
  }

  // パスワードリセット要求
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const response = await this.client.post('/api/auth/forgot-password', data)
    // AuthControllerは成功時にメッセージを直接返すため、エラーがなければ成功
  }

  // パスワードリセット実行
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const response = await this.client.post('/api/auth/reset-password', data)
    // AuthControllerは成功時にメッセージを直接返すため、エラーがなければ成功
  }

  // ユーザープロフィール取得
  async getProfile(): Promise<User> {
    try {
      const response = await this.client.get<User>('/api/auth/profile')
      console.log('Auth service getProfile response:', response)

      // APIサーバーは直接 User オブジェクトを返します
      if (response?.id) {
        return response
      }

      throw new Error('無効なレスポンス形式です')
    } catch (error) {
      console.error('Auth service getProfile error:', error)
      throw error
    }
  }

  // パスワード変更
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await this.client.put('/api/auth/password', data)
    // AuthControllerは成功時にメッセージを直接返すため、エラーがなければ成功
  }

  // メールアドレス変更
  async changeEmail(data: ChangeEmailRequest): Promise<void> {
    const response = await this.client.put('/api/auth/email', data)
    // AuthControllerは成功時にメッセージを直接返すため、エラーがなければ成功
  }

  // ユーザー設定更新
  async updateSettings(data: UpdateSettingsRequest): Promise<User> {
    const response = await this.client.put<User>('/api/auth/settings', data)

    // AuthControllerは直接Userオブジェクトを返す
    if (response?.id) {
      return response
    }

    throw new Error('設定の更新に失敗しました')
  }

  // ユーザー情報更新
  async updateUser(data: UpdateUserRequest): Promise<User> {
    const response = await this.client.put<User>('/api/auth/profile', data)

    // AuthControllerは直接Userオブジェクトを返す
    if (response?.id) {
      return response
    }

    throw new Error('ユーザー情報の更新に失敗しました')
  }

  // アカウント削除
  async deleteAccount(): Promise<void> {
    const response = await this.client.delete('/api/auth/account')

    // AuthControllerは成功時にメッセージを直接返すため、エラーがなければ成功
    // アカウント削除後はトークンをクリア
    this.client.clearToken()
  }

  // 認証状態確認
  isAuthenticated(): boolean {
    return !!this.client.getToken()
  }
}

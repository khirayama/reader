// テスト用の認証サービス（テスト用Prismaクライアントを使用）
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { testPrisma as prisma } from './prisma';
import { User } from '../../node_modules/.prisma/test-client';

// JWT ペイロード型定義
export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// ユーザー応答型（パスワードを除外）
export type UserResponse = Omit<User, 'password'>;

// 認証応答型
export interface AuthResponse {
  user: UserResponse;
  token: string;
}

// JWT設定
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
const JWT_EXPIRES_IN = '24h';

export class TestAuthService {
  // パスワードをハッシュ化
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // パスワードを検証
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWTトークンを生成
  static generateToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  // JWTトークンを検証
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('無効なトークンです');
    }
  }

  // パスワードリセットトークンを生成
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ユーザーからパスワードを除外
  static excludePassword(user: User): UserResponse {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // ユーザー登録
  static async register(email: string, password: string): Promise<AuthResponse> {
    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('このメールアドレスは既に登録されています');
    }

    // パスワードハッシュ化
    const hashedPassword = await this.hashPassword(password);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // JWT生成
    const token = this.generateToken(user);

    return {
      user: this.excludePassword(user),
      token,
    };
  }

  // ログイン
  static async login(email: string, password: string): Promise<AuthResponse> {
    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // パスワード検証
    const isValidPassword = await this.verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // JWT生成
    const token = this.generateToken(user);

    return {
      user: this.excludePassword(user),
      token,
    };
  }

  // パスワードリセット要求
  static async requestPasswordReset(email: string): Promise<string> {
    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // セキュリティ上、ユーザーが存在しない場合でも成功として扱う
      return '有効なメールアドレスの場合、パスワードリセットのリンクを送信しました';
    }

    // 既存の未使用トークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // 新しいリセットトークンを生成
    const token = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    return 'パスワードリセットのリンクをメールで送信しました';
  }

  // パスワードリセット実行
  static async resetPassword(token: string, newPassword: string): Promise<string> {
    // リセットトークン検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new Error('無効なリセットトークンです');
    }

    if (resetToken.used) {
      throw new Error('このリセットトークンは既に使用されています');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error('リセットトークンの有効期限が切れています');
    }

    // パスワード更新
    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.$transaction([
      // パスワード更新
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      // トークンを使用済みにマーク
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return 'パスワードが正常に更新されました';
  }

  // ユーザーIDでユーザー取得
  static async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user ? this.excludePassword(user) : null;
  }

  // パスワード変更
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 現在のパスワード検証
    const isValidPassword = await this.verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      throw new Error('現在のパスワードが正しくありません');
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await this.hashPassword(newPassword);

    // パスワード更新
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return 'パスワードが正常に更新されました';
  }

  // メールアドレス変更
  static async changeEmail(userId: string, newEmail: string, password: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // パスワード検証
    const isValidPassword = await this.verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('パスワードが正しくありません');
    }

    // メールアドレス重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('このメールアドレスは既に使用されています');
    }

    // メールアドレス更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    });

    return this.excludePassword(updatedUser);
  }

  // ユーザー設定更新
  static async updateUserSettings(
    userId: string,
    settings: { theme?: string; language?: string }
  ): Promise<UserResponse> {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: settings,
    });

    return this.excludePassword(updatedUser);
  }

  // アカウント削除
  static async deleteAccount(userId: string, password: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // パスワード検証
    const isValidPassword = await this.verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('パスワードが正しくありません');
    }

    // ユーザー削除（Cascadeにより関連データも削除される）
    await prisma.user.delete({
      where: { id: userId },
    });

    return 'アカウントが正常に削除されました';
  }

  // テスト用ユーザー作成（テスト専用）
  static async createTestUser(email?: string, password?: string): Promise<AuthResponse> {
    const testEmail = email || `test${Date.now()}@example.com`;
    const testPassword = password || 'TestPassword123';

    return this.register(testEmail, testPassword);
  }
}

// エクスポート用のインスタンス
export const authService = TestAuthService;
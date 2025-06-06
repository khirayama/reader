import { Request, Response } from 'express';
import { AuthService, AuthResponse, UserResponse } from '../services/authService';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  ChangeEmailInput,
  UpdateUserSettingsInput,
  DeleteAccountInput,
} from '../validators/authSchemas';

// 共通エラー応答型
interface ErrorResponse {
  error: string;
  details?: string;
}

// 成功メッセージ応答型
interface SuccessResponse {
  message: string;
}

export class AuthController {
  // ユーザー登録
  static async register(
    req: Request<{}, AuthResponse | ErrorResponse, RegisterInput>,
    res: Response<AuthResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.register(email, password);

      res.status(201).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登録処理でエラーが発生しました';

      res.status(400).json({
        error: errorMessage,
      });
    }
  }

  // ログイン
  static async login(
    req: Request<{}, AuthResponse | ErrorResponse, LoginInput>,
    res: Response<AuthResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ログイン処理でエラーが発生しました';

      res.status(401).json({
        error: errorMessage,
      });
    }
  }

  // パスワードリセット要求
  static async forgotPassword(
    req: Request<{}, SuccessResponse | ErrorResponse, ForgotPasswordInput>,
    res: Response<SuccessResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const { email } = req.body;

      const message = await AuthService.requestPasswordReset(email);

      res.status(200).json({
        message,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'パスワードリセット要求でエラーが発生しました';

      res.status(400).json({
        error: errorMessage,
      });
    }
  }

  // パスワードリセット実行
  static async resetPassword(
    req: Request<{}, SuccessResponse | ErrorResponse, ResetPasswordInput>,
    res: Response<SuccessResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const { token, password } = req.body;

      const message = await AuthService.resetPassword(token, password);

      res.status(200).json({
        message,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'パスワードリセットでエラーが発生しました';

      res.status(400).json({
        error: errorMessage,
      });
    }
  }

  // 現在のユーザー情報取得
  static async getProfile(
    req: Request,
    res: Response<UserResponse | ErrorResponse>
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          error: '認証が必要です',
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({
          error: 'ユーザーが見つかりません',
        });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ユーザー情報取得でエラーが発生しました';

      res.status(500).json({
        error: errorMessage,
      });
    }
  }

  // パスワード変更
  static async changePassword(
    req: Request<{}, SuccessResponse | ErrorResponse, ChangePasswordInput>,
    res: Response<SuccessResponse | ErrorResponse>
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          error: '認証が必要です',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      const message = await AuthService.changePassword(req.user.userId, currentPassword, newPassword);

      res.status(200).json({
        message,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'パスワード変更でエラーが発生しました';

      res.status(400).json({
        error: errorMessage,
      });
    }
  }

  // メールアドレス変更
  static async changeEmail(
    req: Request<{}, UserResponse | ErrorResponse, ChangeEmailInput>,
    res: Response<UserResponse | ErrorResponse>
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          error: '認証が必要です',
        });
        return;
      }

      const { email, password } = req.body;

      const user = await AuthService.changeEmail(req.user.userId, email, password);

      res.status(200).json(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'メールアドレス変更でエラーが発生しました';

      res.status(400).json({
        error: errorMessage,
      });
    }
  }

  // ユーザー設定更新
  static async updateSettings(
    req: Request<{}, UserResponse | ErrorResponse, UpdateUserSettingsInput>,
    res: Response<UserResponse | ErrorResponse>
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          error: '認証が必要です',
        });
        return;
      }

      const settings = req.body;

      const user = await AuthService.updateUserSettings(req.user.userId, settings);

      res.status(200).json(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ユーザー設定更新でエラーが発生しました';

      res.status(400).json({
        error: errorMessage,
      });
    }
  }

  // アカウント削除
  static async deleteAccount(
    req: Request<{}, SuccessResponse | ErrorResponse, DeleteAccountInput>,
    res: Response<SuccessResponse | ErrorResponse>
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          error: '認証が必要です',
        });
        return;
      }

      const { password } = req.body;

      const message = await AuthService.deleteAccount(req.user.userId, password);

      res.status(200).json({
        message,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アカウント削除でエラーが発生しました';

      res.status(400).json({
        error: errorMessage,
      });
    }
  }
}
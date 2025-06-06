import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireAuth } from '../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  changeEmailSchema,
  updateUserSettingsSchema,
  deleteAccountSchema,
} from '../validators/authSchemas';

const authRouter = Router();

// 認証不要のエンドポイント
authRouter.post('/register', validate(registerSchema), AuthController.register);
authRouter.post('/login', validate(loginSchema), AuthController.login);
authRouter.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// 認証必要のエンドポイント（現在のユーザー情報）
authRouter.get('/profile', requireAuth, AuthController.getProfile);

// 認証必要のエンドポイント（ユーザー設定・アカウント管理）
authRouter.put('/password', requireAuth, validate(changePasswordSchema), AuthController.changePassword);
authRouter.put('/email', requireAuth, validate(changeEmailSchema), AuthController.changeEmail);
authRouter.put('/settings', requireAuth, validate(updateUserSettingsSchema), AuthController.updateSettings);
authRouter.delete('/account', requireAuth, validate(deleteAccountSchema), AuthController.deleteAccount);

export { authRouter };
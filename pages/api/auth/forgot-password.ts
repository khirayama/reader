import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "../../../lib/prisma";
import { sendPasswordResetEmail } from "../../../lib/email";

// 入力バリデーションスキーマ
const emailSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエストのみ許可
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // リクエストボディのバリデーション
    const { email } = emailSchema.parse(req.body);
    
    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // セキュリティのため、ユーザーが存在しなくても同じレスポンスを返す
    if (!user) {
      // 本番環境では実際にはログを残す等の処理が必要
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({ message: "パスワードリセットリンクが送信されました（存在しない場合も同じレスポンス）" });
    }

    // リセットトークンの生成（32バイトのランダムな文字列）
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1時間後に期限切れ

    // トークンをデータベースに保存
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    // メール送信処理
    if (process.env.NODE_ENV === 'production') {
      await sendPasswordResetEmail(user.email, token);
    } else {
      // 開発環境ではコンソールにリンクを表示
      console.log(`Password reset token for ${email}: ${token}`);
      console.log(`Reset link: http://localhost:3000/auth/reset-password?token=${token}`);
    }

    return res.status(200).json({ message: "パスワードリセットリンクが送信されました" });
    
  } catch (error) {
    console.error("Password reset request error:", error);
    
    // ZodError の場合はバリデーションエラーとして処理
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "入力データが無効です",
        errors: error.errors,
      });
    }
    
    // その他のエラー
    return res.status(500).json({ message: "パスワードリセットリクエストに失敗しました" });
  }
}
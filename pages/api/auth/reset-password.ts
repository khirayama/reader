import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { hash } from "bcrypt";
import { prisma } from "../../../lib/prisma";

// 入力バリデーションスキーマ
const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエストのみ許可
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // リクエストボディのバリデーション
    const { token, password } = resetSchema.parse(req.body);
    
    // トークンの検証
    const storedToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      return res.status(400).json({ message: "無効または期限切れのトークンです" });
    }

    // ユーザーの検索
    const user = await prisma.user.findUnique({
      where: { email: storedToken.identifier },
    });

    if (!user) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    // パスワードのハッシュ化
    const hashedPassword = await hash(password, 10);

    // ユーザーのパスワード更新
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 使用済みトークンを削除
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: storedToken.identifier,
          token: storedToken.token,
        },
      },
    });

    return res.status(200).json({ message: "パスワードが正常にリセットされました" });
    
  } catch (error) {
    console.error("Password reset error:", error);
    
    // ZodError の場合はバリデーションエラーとして処理
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "入力データが無効です",
        errors: error.errors,
      });
    }
    
    // その他のエラー
    return res.status(500).json({ message: "パスワードリセットに失敗しました" });
  }
}
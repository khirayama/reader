import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { hash } from "bcrypt";
import { prisma } from "../../../lib/prisma";

// 入力バリデーションスキーマ
const signupSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエストのみ許可
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // リクエストボディのバリデーション
    const { email, password } = signupSchema.parse(req.body);
    
    // 既存ユーザーの確認
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "このメールアドレスは既に登録されています" });
    }

    // パスワードのハッシュ化
    const hashedPassword = await hash(password, 10);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        settings: {
          create: {
            theme: "light",
            language: "ja",
          },
        },
      },
    });

    // 成功レスポンス（パスワードを含まない）
    return res.status(201).json({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });
    
  } catch (error) {
    console.error("Signup error:", error);
    
    // ZodError の場合はバリデーションエラーとして処理
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "入力データが無効です",
        errors: error.errors,
      });
    }
    
    // その他のエラー
    return res.status(500).json({ message: "ユーザー登録に失敗しました" });
  }
}
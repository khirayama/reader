import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { supabaseAdmin } from "../../../lib/supabase";

// 入力バリデーションスキーマ
const initializeUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

type ResponseData = {
  success?: boolean;
  message?: string;
  error?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // POSTリクエストのみ許可
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // リクエストボディのバリデーション
    const { userId } = initializeUserSchema.parse(req.body);

    // Supabaseからユーザー情報を取得
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return res.status(400).json({ message: "Invalid user ID", error: userError });
    }

    // メールアドレスを取得
    const email = userData.user.email;

    if (!email) {
      return res.status(400).json({ message: "User has no email address" });
    }

    // データベースにユーザー情報を保存
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: email,
        emailVerified: userData.user.email_confirmed_at ? new Date(userData.user.email_confirmed_at) : null,
      },
      create: {
        id: userId,
        email: email,
        emailVerified: userData.user.email_confirmed_at ? new Date(userData.user.email_confirmed_at) : null,
        settings: {
          create: {
            theme: "light",
            language: "ja",
          },
        },
      },
    });

    // 成功レスポンス
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("User initialization error:", error);

    // ZodError の場合はバリデーションエラーとして処理
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid input data",
        error: error.errors,
      });
    }

    // その他のエラー
    return res.status(500).json({ message: "Failed to initialize user", error });
  }
}
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { withAuth } from "../../../lib/auth-middleware";
import { supabaseAdmin } from "../../../lib/supabase";

// 入力バリデーションスキーマ
const passwordUpdateSchema = z.object({
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

type ResponseData = {
  success?: boolean;
  message?: string;
  error?: any;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
  userId: string
) {
  // POSTリクエストのみ許可
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // リクエストボディのバリデーション
    const { password } = passwordUpdateSchema.parse(req.body);

    // Supabaseでパスワードを更新
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (error) {
      throw new Error(`パスワードの更新に失敗しました: ${error.message}`);
    }

    return res.status(200).json({ success: true, message: "パスワードが更新されました" });
  } catch (error) {
    console.error("Password update error:", error);

    // ZodError の場合はバリデーションエラーとして処理
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "入力データが無効です",
        error: error.errors,
      });
    }

    // その他のエラー
    return res.status(500).json({
      message: "パスワードの更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default withAuth(handler);

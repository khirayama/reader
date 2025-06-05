import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { withAuth } from "../../../lib/auth-middleware";
import { prisma } from "../../../lib/prisma";
import { supabaseAdmin } from "../../../lib/supabase";

// 入力バリデーションスキーマ
const profileUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
});

type ResponseData = {
  success?: boolean;
  message?: string;
  error?: any;
  user?: any;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
  userId: string
) {
  // GETリクエストでユーザープロフィールを取得
  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          settings: {
            select: {
              theme: true,
              language: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error("Profile fetch error:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  }

  // PUTリクエストでユーザープロフィールを更新
  if (req.method === "PUT") {
    try {
      // リクエストボディのバリデーション
      const updateData = profileUpdateSchema.parse(req.body);

      // メールアドレスが更新される場合、Supabaseの認証情報も更新
      if (updateData.email) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { email: updateData.email }
        );

        if (error) {
          throw new Error(`メールアドレスの更新に失敗しました: ${error.message}`);
        }
      }

      // データベースのユーザー情報を更新
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.email && { email: updateData.email }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          settings: {
            select: {
              theme: true,
              language: true,
            },
          },
        },
      });

      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Profile update error:", error);

      // ZodError の場合はバリデーションエラーとして処理
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "入力データが無効です",
          error: error.errors,
        });
      }

      return res.status(500).json({
        message: "プロフィールの更新に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 許可されていないメソッド
  return res.status(405).json({ message: "Method not allowed" });
}

export default withAuth(handler);

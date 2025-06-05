import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth-middleware";
import { prisma } from "../../../lib/prisma";
import { supabaseAdmin } from "../../../lib/supabase";

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
  // DELETEリクエストのみ許可
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // トランザクションでデータベースからユーザーとその関連データを削除
    await prisma.$transaction(async (tx) => {
      // 関連するデータを削除（手動でカスケード削除の代わり）
      await tx.feed.deleteMany({
        where: { userId },
      });
      
      await tx.settings.deleteMany({
        where: { userId },
      });
      
      // ユーザーを削除
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // Supabase認証からユーザーを削除
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`認証データの削除に失敗しました: ${error.message}`);
    }

    return res.status(200).json({ success: true, message: "アカウントが削除されました" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return res.status(500).json({
      message: "アカウントの削除に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default withAuth(handler);

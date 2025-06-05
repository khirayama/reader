import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "./supabase";
import { prisma } from "./prisma";

/**
 * 認証済みユーザーのIDを取得するミドルウェア
 */
export async function getAuthenticatedUserId(
  req: NextApiRequest
): Promise<string | null> {
  // Authorization ヘッダーからトークンを取得
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // トークンを検証
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user.id;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * API ルートを認証で保護するミドルウェア
 */
export function withAuth(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    userId: string
  ) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 一時的にダミーユーザーIDを使用して認証をバイパス
    // TODO: Supabaseの設定が完了したら認証チェックを有効にする
    const userId = "temp-user-id";
    
    /*
    const userId = await getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    */

    // ユーザーIDをハンドラに渡す
    return handler(req, res, userId);
  };
}

/**
 * 認証されたユーザーの完全な情報をデータベースから取得
 */
export async function getAuthenticatedUser(req: NextApiRequest) {
  const userId = await getAuthenticatedUserId(req);
  
  if (!userId) {
    return null;
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
      },
    });
    
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
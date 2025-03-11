import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETリクエストのみ許可
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "トークンが必要です" });
    }

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

    return res.status(200).json({ valid: true });
    
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ message: "トークン検証に失敗しました" });
  }
}
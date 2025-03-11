import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE method
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Get session to authorize the request
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userEmail = session.user.email as string;
    
    // First, delete any related records in other tables (if necessary)
    // This will depend on your schema relationships
    
    // Then delete the user
    await prisma.user.delete({
      where: { email: userEmail },
    });
    
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return res.status(500).json({ message: "An error occurred while deleting your account" });
  }
}
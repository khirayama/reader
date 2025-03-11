import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import bcrypt from "bcrypt";

// Validation schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PUT method
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Get session to authorize the request
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Validate request body
    const data = passwordSchema.parse(req.body);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });
    
    if (!user || !user.password) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);
    
    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: error.errors,
      });
    }
    
    console.error("Password update error:", error);
    return res.status(500).json({ message: "An error occurred while updating password" });
  }
}
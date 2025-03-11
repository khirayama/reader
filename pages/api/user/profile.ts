import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

// Validation schema
const profileSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
    const data = profileSchema.parse(req.body);
    
    // Check if email is changing and already exists
    if (data.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email as string },
      data: {
        email: data.email,
      },
    });
    
    // Return updated user (excluding sensitive fields)
    return res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: error.errors,
      });
    }
    
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "An error occurred while updating profile" });
  }
}
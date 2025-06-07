import type { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (!adminToken) {
    res.status(500).json({ error: 'Admin token not configured' });
    return;
  }

  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    res.status(401).json({ error: 'Unauthorized admin access' });
    return;
  }

  next();
};
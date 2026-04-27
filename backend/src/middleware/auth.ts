import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: number;
  email?: string;
}
export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  
  const token = auth.slice(7);
  const secret = process.env.JWT_SECRET || 'dev_secret';
  console.log("Authenticating token:", token);
  
  try {
    const payload = jwt.verify(token, secret) as any;
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type UserRole = 'tutor' | 'customer' | 'admin';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/**
 * Verifies the Bearer JWT in the Authorization header and attaches
 * `req.user` to the request. Returns 401 if the token is missing or invalid.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env.JWT_SECRET ?? 'dev_secret';

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware factory that restricts access to users whose role is in the
 * provided list. Must be used after `authenticate`.
 * Returns 403 if the user's role is not allowed.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

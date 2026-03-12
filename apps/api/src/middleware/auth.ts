/**
 * apps/api/src/middleware/auth.ts
 * JWT Authentication middleware + Supabase Auth integration
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface AuthUser {
  id:    string;
  email: string;
  plan:  "free" | "pro" | "elite";
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * requireAuth middleware
 * Accepts both:
 *  - Supabase JWT (from Supabase Auth)
 *  - Custom JWT (for API clients)
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Try Supabase JWT first
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (user && !error) {
      req.user = {
        id:    user.id,
        email: user.email!,
        plan:  (user.user_metadata?.plan as any) || "free",
      };
      return next();
    }
  } catch {
    // fall through to custom JWT
  }

  try {
    // Custom JWT fallback
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * requirePlan middleware factory
 * Usage: requirePlan("pro") — rejects free users
 */
export function requirePlan(minPlan: "pro" | "elite") {
  const rank = { free: 0, pro: 1, elite: 2 };
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRank = rank[req.user?.plan || "free"];
    const minRank  = rank[minPlan];
    if (userRank < minRank) {
      res.status(403).json({
        error: `This feature requires the ${minPlan} plan`,
        upgradeUrl: "/monetize",
      });
      return;
    }
    next();
  };
}

import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return decoded;
  } catch {
    return null;
  }
}

/** Reads a Bearer token from a standard Web Request. Kept for scripting/tests. */
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Minimal request shape needed to resolve a session: Express `Request` plus the
 * `token` cookie populated by `cookie-parser`. Typed structurally so this module
 * does not depend on Express directly.
 */
type SessionRequest = {
  cookies?: Record<string, string | undefined>;
  headers: { authorization?: string | string[] | undefined };
};

/**
 * Resolves the signed-in user for a request, reading the `token` cookie or an
 * `Authorization: Bearer` header.
 *
 * The role is re-read from the database rather than trusted from the JWT payload. A token
 * is valid for 7 days, so trusting its embedded role means a promoted or demoted user keeps
 * their old privileges for up to a week. Prefer this over `verifyToken(...)` for any route
 * that makes an authorization decision.
 *
 * Returns null when there is no valid session, or when the account no longer exists.
 */
export async function getSessionUser(
  request: SessionRequest
): Promise<{ id: number; role: string } | null> {
  const authHeader = request.headers.authorization;
  const bearer = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const token =
    request.cookies?.token ??
    (bearer?.startsWith("Bearer ") ? bearer.substring(7) : undefined);
  const decoded = verifyToken(token || "");
  if (!decoded) return null;

  const result = await db()
    .from("users")
    .select("id, role")
    .eq("id", decoded.userId)
    .maybeSingle();

  if (result.error || !result.data) return null;
  return { id: Number(result.data.id), role: result.data.role };
}

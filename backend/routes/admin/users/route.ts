import { db } from "../../../lib/db";
import { verifyToken } from "../../../lib/auth";
import { describeError, num } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

function requireAdmin(request: Request) {
  const token = request.cookies?.token;
  if (!token) return false;
  const decoded = verifyToken(token);
  return decoded?.role === "admin";
}

async function handleGET(req: Request, res: Response) {
  if (!requireAdmin(req)) return res.status(403).json({ error: "Forbidden" });

  try {
    const result = await db()
      .from("users")
      .select("id, name, email, role, status, created_at")
      .order("id", { ascending: false });

    if (result.error) throw result.error;

    return res.json({
      users: (result.data ?? []).map((user) => ({ ...user, id: num(user.id) })),
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", describeError(error));
    return res.status(500).json({ error: "Could not load users" });
  }
}

router.get("/", handleGET);

export default router;

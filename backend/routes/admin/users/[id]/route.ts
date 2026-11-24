import { db } from "../../../../lib/db";
import { verifyToken } from "../../../../lib/auth";
import { describeError } from "../../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

const ROLES = new Set(["user", "admin"]);
const STATUSES = new Set(["active", "blocked"]);

function requireAdmin(request: Request) {
  const token = request.cookies?.token;
  if (!token) return false;
  const decoded = verifyToken(token);
  return decoded?.role === "admin";
}

async function handlePATCH(req: Request, res: Response) {
  if (!requireAdmin(req)) return res.status(403).json({ error: "Forbidden" });

  const id = req.params.id;

  let body: { role?: string; status?: string };
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Whitelist the columns rather than spreading the body into `.update()` â€” that
  // would let a crafted request rewrite `password` or `email` through this route.
  const updates: { role?: string; status?: string } = {};
  if (body.role) {
    if (!ROLES.has(body.role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    updates.role = body.role;
  }
  if (body.status) {
    if (!STATUSES.has(body.status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const { error } = await db().from("users").update(updates).eq("id", id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error(`PATCH /api/admin/users/${id} error:`, describeError(error));
    return res.status(500).json({ error: "Could not update user" });
  }
}

async function handleDELETE(req: Request, res: Response) {
  if (!requireAdmin(req)) return res.status(403).json({ error: "Forbidden" });

  const id = req.params.id;

  try {
    // customer_orders, favorites and addresses all cascade from users, so the
    // customer's history goes with the account in one statement.
    const { error } = await db().from("users").delete().eq("id", id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/admin/users/${id} error:`, describeError(error));
    return res.status(500).json({ error: "Could not delete user" });
  }
}

router.patch("/:id", handlePATCH);
router.delete("/:id", handleDELETE);

export default router;

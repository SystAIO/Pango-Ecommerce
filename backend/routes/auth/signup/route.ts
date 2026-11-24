import bcrypt from "bcryptjs";
import { db } from "../../../lib/db";
import { generateToken } from "../../../lib/auth";
import { describeError, num } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

async function handlePOST(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Supabase/PostgREST matches `eq` case-sensitively, so normalise here rather
    // than letting Bob@example.com and bob@example.com become two accounts.
    const normalisedEmail = String(email).trim().toLowerCase();

    const existing = await db()
      .from("users")
      .select("id")
      .eq("email", normalisedEmail)
      .maybeSingle();

    if (existing.error) throw existing.error;
    if (existing.data) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);

    // Always "user". A signup request is unauthenticated, so trusting a `role`
    // field from it would let anyone mint an admin account. Promotion happens
    // through the admin dashboard, which re-checks the caller's role.
    //
    // The unused `role` from the destructured body is intentionally ignored.
    void role;
    const userRole = "user";

    const created = await db()
      .from("users")
      .insert({ name, email: normalisedEmail, password: hashedPassword, role: userRole })
      .select("id")
      .single();

    if (created.error) throw created.error;

    const userId = num(created.data.id);
    const token = generateToken(userId, userRole);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      message: "Account created successfully",
      user: { id: userId, name, email: normalisedEmail, role: userRole },
      token,
    });
  } catch (error) {
    console.error("Signup error:", describeError(error));
    return res.status(500).json({ error: "Internal server error" });
  }
}

router.post("/", handlePOST);

export default router;

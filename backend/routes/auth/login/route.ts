import bcrypt from "bcryptjs";
import { db } from "../../../lib/db";
import { generateToken } from "../../../lib/auth";
import { describeError, num } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

async function handlePOST(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await db()
      .from("users")
      .select("id, name, email, role, status, password")
      .eq("email", String(email).trim().toLowerCase())
      .maybeSingle();

    if (result.error) throw result.error;

    const user = result.data;
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ error: "Your account has been blocked. Contact support." });
    }

    const isValid = await bcrypt.compare(String(password), user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const id = num(user.id);
    const token = generateToken(id, user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      message: "Login successful",
      user: { id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    console.error("Login error:", describeError(error));
    return res.status(500).json({ error: "Internal server error" });
  }
}

router.post("/", handlePOST);

export default router;

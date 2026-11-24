import { Router, type Request, type Response } from "express";

const router = Router();

async function handlePOST(req: Request, res: Response) {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return res.json({ message: "Logged out successfully" });
}

router.post("/", handlePOST);

export default router;

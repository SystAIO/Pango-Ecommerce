import { getSessionUser } from "../../lib/auth";
import { readReferralConfig, writeReferralConfig } from "../../lib/referral-store";
import {
  DEFAULT_REFERRAL_CONFIG,
  mergeReferralConfig,
} from "../../lib/referral-config";
import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const config = mergeReferralConfig(readReferralConfig() ?? DEFAULT_REFERRAL_CONFIG);
  // Never expose the admin-only settings beyond what checkout needs.
  res.json({ code: config.code, label: config.label, percent: config.percent, active: config.active });
});

router.put("/", async (req: Request, res: Response) => {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid config" });
  }
  try {
    const merged = mergeReferralConfig(req.body);
    writeReferralConfig(merged);
    return res.json({ success: true, config: merged });
  } catch (error) {
    console.error("PUT /api/referral-config error:", error);
    return res.status(500).json({ error: "Could not save referral code" });
  }
});

export default router;

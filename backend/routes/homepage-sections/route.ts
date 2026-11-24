import { getSessionUser } from "../../lib/auth";
import { db, isSupabaseConfigured } from "../../lib/db";
import { describeError } from "../../lib/supabase";
import { writeLocalSections } from "../../lib/homepage-store";
import {
  getHomepageSections,
  mergeSections,
  SECTION_KEYS,
  type HomeSections,
} from "../../lib/homepage-content";
import { Router, type Request, type Response } from "express";

const router = Router();

/**
 * GET /api/homepage-sections — the merged homepage section content for the
 * storefront. Public: the homepage is anonymous. Falls back to built-in
 * defaults when the table is missing or unconfigured.
 */
async function handleGET(_req: Request, res: Response) {
  const sections = await getHomepageSections();
  res.json(sections);
}

/**
 * PUT /api/homepage-sections — replace the homepage content (admin only).
 *
 * Body: a partial map of section keys → content objects, e.g.
 * `{ hero: { enabled: false } }`. Every provided section is merged over the
 * built-in defaults and upserted as one row. Sections absent from the body are
 * left untouched. Validation is lenient by design: a malformed field falls
 * back to its default rather than rejecting the whole save.
 */
async function handlePUT(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "Supabase is not configured — set it up first (see backend/.env.example)." });
  }

  const body = req.body as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const provided = SECTION_KEYS.filter((key) => key in body);
  const hasOrder = Array.isArray(body.order);
  if (provided.length === 0 && !hasOrder) {
    return res.status(400).json({ error: "Provide at least one homepage section to save." });
  }

  // Merge each provided section individually so an unknown field in one
  // section never touches another.
  const merged = mergeSections(body);
  const now = new Date().toISOString();
  const rows: { key: string; data: unknown; updated_at: string }[] = provided.map((key) => ({
    key,
    data: merged[key],
    updated_at: now,
  }));
  // The display order is stored as its own row so a later partial save of a
  // single section cannot reset it to the defaults.
  if (hasOrder) rows.push({ key: "order", data: merged.order, updated_at: now });

  try {
    const { error } = await db().from("homepage_sections").upsert(rows, { onConflict: "key" });
    if (error) {
      const missing = error.message.includes("42P01") || error.message.includes("homepage_sections");
      if (missing) {
        // The SQL migration has not been applied. Persist locally so admin
        // toggles, reordering and cards work on a fresh checkout.
        writeLocalSections(merged as unknown as Record<string, unknown>);
        return res.json({ success: true, sections: merged as HomeSections, storage: "local" });
      }
      console.error("PUT /api/homepage-sections error:", error.message);
      return res.status(500).json({ error: "Could not save the homepage sections" });
    }

    res.json({ success: true, sections: merged as HomeSections });
  } catch (error) {
    console.error("PUT /api/homepage-sections error:", describeError(error));
    res.status(500).json({ error: "Could not save the homepage sections" });
  }
}

router.get("/", handleGET);
router.put("/", handlePUT);

export default router;

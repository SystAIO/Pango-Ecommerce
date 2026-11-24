import { db, isSupabaseConfigured } from "../../lib/db";
import { getSessionUser } from "../../lib/auth";
import { describeError } from "../../lib/supabase";
import { readLocalMenu, writeLocalMenu } from "../../lib/navbar-store";
import {
  DEFAULT_MENU,
  validateMenuSection,
  validateMenuLinks,
  type NavbarMenu,
  type NavbarMenuSection,
} from "../../lib/navbar-menu";
import { Router, type Request, type Response } from "express";

const router = Router();

/**
 * GET /api/navbar-menu — the Beyoung-style mega menu.
 *
 * Public: the navbar renders for anonymous visitors. Falls back to the
 * built-in defaults per section when a stored row is missing or invalid —
 * the storefront never shows an empty menu.
 */
async function handleGET(_req: Request, res: Response) {
  const local = () => {
    const saved = readLocalMenu();
    if (saved && typeof saved === "object") {
      return res.json({
        topwear: validateMenuSection((saved as NavbarMenu).topwear) ?? DEFAULT_MENU.topwear,
        bottomwear: validateMenuSection((saved as NavbarMenu).bottomwear) ?? DEFAULT_MENU.bottomwear,
        links: validateMenuLinks((saved as NavbarMenu).links) ?? DEFAULT_MENU.links,
      });
    }
    return res.json(DEFAULT_MENU);
  };

  // A successful admin save is written locally first, so it must win over any
  // older row in Supabase — otherwise a rename (e.g. Winterwear → Summerwear)
  // would appear to save but never show up on the storefront or admin.
  const saved = readLocalMenu();
  if (saved && typeof saved === "object") return local();

  try {
    if (!isSupabaseConfigured()) {
      return local();
    }

    const { data, error } = await db()
      .from("navbar_menu")
      .select("key, label, columns")
      .in("key", ["topwear", "bottomwear", "links"]);

    if (error || !data) {
      console.warn("GET /api/navbar-menu using local fallback:", error?.message);
      return local();
    }

    const menu: NavbarMenu = {
      topwear: DEFAULT_MENU.topwear,
      bottomwear: DEFAULT_MENU.bottomwear,
      links: DEFAULT_MENU.links,
    };

    for (const row of data) {
      if (row.key === "links") {
        // Stored as `{ links: [...] }` in the `columns` jsonb column.
        const stored = (row.columns ?? {}) as { links?: unknown };
        const links = validateMenuLinks(stored.links ?? row.columns);
        if (links) menu.links = links;
        continue;
      }

      const section = validateMenuSection({ label: row.label, columns: row.columns });
      if (!section) continue;
      if (row.key === "topwear") menu.topwear = section;
      if (row.key === "bottomwear") menu.bottomwear = section;
    }

    return res.json(menu);
  } catch (error) {
    console.error("GET /api/navbar-menu error:", describeError(error));
    return local();
  }
}

/**
 * PUT /api/navbar-menu — replace the mega menu (admin only).
 *
 * Body: `{ topwear: Section, bottomwear: Section, links: [{ label, href }] }`.
 * The role is re-read from the database (not the JWT payload), so a demoted
 * admin loses this immediately. Both sections and the links list must validate.
 */
async function handlePUT(req: Request, res: Response) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const body = req.body as { topwear?: unknown; bottomwear?: unknown; links?: unknown } | null;
    const topwear = validateMenuSection(body?.topwear);
    const bottomwear = validateMenuSection(body?.bottomwear);
    const links = validateMenuLinks(body?.links);

    if (!topwear || !bottomwear) {
      return res
        .status(400)
        .json({ error: "Each dropdown needs a label and at least one column with a title." });
    }
    if (!links) {
      return res
        .status(400)
        .json({ error: "Each link needs a label and a site-relative or absolute http(s) URL." });
    }

    const menu = { topwear, bottomwear, links } satisfies NavbarMenu;

    if (!isSupabaseConfigured()) {
      writeLocalMenu(menu);
      return res.json({ success: true, menu });
    }

    const now = new Date().toISOString();
    const rows = [
      { key: "topwear", label: topwear.label, columns: topwear.columns, updated_at: now },
      { key: "bottomwear", label: bottomwear.label, columns: bottomwear.columns, updated_at: now },
      { key: "links", label: "links", columns: { links }, updated_at: now },
    ] as { key: string; label: string; columns: unknown; updated_at: string }[];

    const { error } = await db().from("navbar_menu").upsert(rows, { onConflict: "key" });
    if (error) {
      const missing = error.message.includes("42P01") || error.message.includes("navbar_menu");
      if (missing) {
        writeLocalMenu(menu);
        return res.json({ success: true, menu, storage: "local" });
      }
      console.error("PUT /api/navbar-menu error:", error.message);
      return res.status(500).json({ error: "Could not save the navbar menu" });
    }

    return res.json({ success: true, menu });
  } catch (error) {
    console.error("PUT /api/navbar-menu error:", describeError(error));
    return res.status(500).json({ error: "Could not save the navbar menu" });
  }
}

router.get("/", handleGET);
router.put("/", handlePUT);

export default router;

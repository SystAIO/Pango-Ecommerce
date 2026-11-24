/**
 * Local fallback for homepage sections when the Supabase `homepage_sections`
 * table has not been created yet.
 *
 * The database remains the primary store. This file store exists so that a
 * fresh checkout is fully editable out of the box: without it every admin save
 * returns 503 and toggles never persist. As soon as the SQL migration is
 * applied, the database path wins and this file is ignored on reads.
 */

import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".data", "homepage-sections.json");

/** Returns the locally saved section map, or null when nothing has been saved. */
export function readLocalSections(): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch (error) {
    console.error("readLocalSections failed:", error);
    return null;
  }
}

/** Persists the whole section map locally. */
export function writeLocalSections(sections: Record<string, unknown>): void {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(sections, null, 2), "utf8");
  } catch (error) {
    console.error("writeLocalSections failed:", error);
    throw error;
  }
}

/** Local fallback for the navbar menu when the SQL table is not present. */

import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".data", "navbar-menu.json");

export function readLocalMenu(): unknown {
  try {
    return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : null;
  } catch (error) {
    console.error("readLocalMenu failed:", error);
    return null;
  }
}

export function writeLocalMenu(menu: unknown): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(menu, null, 2), "utf8");
}

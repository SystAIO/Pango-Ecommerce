/** Local persistence for admin catalogue config (no SQL setup required). */

import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".data", "catalog-config.json");

export function readLocalCatalogConfig(): unknown {
  try {
    return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : null;
  } catch (error) {
    console.error("readLocalCatalogConfig failed:", error);
    return null;
  }
}

export function writeLocalCatalogConfig(config: unknown): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(config, null, 2), "utf8");
}

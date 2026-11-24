/** Local persistence for combo data (no SQL setup required). */

import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".data", "combos.json");

export function readComboData(): unknown {
  try {
    return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : null;
  } catch (error) {
    console.error("readComboData failed:", error);
    return null;
  }
}

export function writeComboData(data: unknown): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

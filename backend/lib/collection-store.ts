/** Local persistence for admin-managed collections. */

import fs from "node:fs";
import path from "node:path";
import type { CollectionKey } from "./collection-data";

const dir = () => path.join(process.cwd(), ".data", "collections");
const file = (key: CollectionKey) => path.join(dir(), `${key}.json`);

export function readCollection(key: CollectionKey): unknown {
  try {
    const path = file(key);
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : null;
  } catch (error) {
    console.error("readCollection failed:", error);
    return null;
  }
}

export function writeCollection(key: CollectionKey, data: unknown): void {
  fs.mkdirSync(dir(), { recursive: true });
  fs.writeFileSync(file(key), JSON.stringify(data, null, 2), "utf8");
}

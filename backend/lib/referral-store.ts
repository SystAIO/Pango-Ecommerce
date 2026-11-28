import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ReferralConfig } from "./referral-config";

const FILE = path.join(process.cwd(), ".data", "referral-config.json");

export function readReferralConfig(): ReferralConfig | null {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as ReferralConfig;
  } catch {
    return null;
  }
}

export function writeReferralConfig(config: ReferralConfig): void {
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(config, null, 2));
}

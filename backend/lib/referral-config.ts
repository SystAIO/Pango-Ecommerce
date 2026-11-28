/** Admin-managed referral code. One active code with an adjustable percentage. */
export type ReferralConfig = {
  code: string;
  label: string;
  percent: number;
  active: boolean;
};

export const DEFAULT_REFERRAL_CONFIG: ReferralConfig = {
  code: "PANGO10",
  label: "Referral discount",
  percent: 10,
  active: false,
};

function str(value: unknown, fallback: string, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}

export function mergeReferralConfig(value: unknown): ReferralConfig {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const code = str(raw.code, DEFAULT_REFERRAL_CONFIG.code, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  return {
    code: code || DEFAULT_REFERRAL_CONFIG.code,
    label: str(raw.label, DEFAULT_REFERRAL_CONFIG.label, 120),
    percent: Math.min(100, Math.max(0, Number(raw.percent) || 0)),
    active: raw.active === undefined ? DEFAULT_REFERRAL_CONFIG.active : raw.active === true,
  };
}

/** rupees saved for a subtotal, 0 when the code is not active or does not match */
export function referralDiscount(
  config: ReferralConfig,
  code: string,
  subtotal: number
): number {
  if (!config.active || !code || code.trim().toUpperCase() !== config.code) return 0;
  const amount = Math.max(0, Number(subtotal) || 0);
  return Math.min(amount, Math.round((amount * config.percent) / 100));
}

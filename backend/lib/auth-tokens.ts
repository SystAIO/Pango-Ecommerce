/**
 * Single-use, hashed tokens for email verification and password resets.
 *
 * Stored in `user_auth_meta` / `auth_tokens` (see supabase/auth-extra.sql).
 * Only the SHA-256 hash is stored, so a leaked row cannot be replayed as a link.
 */
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { num } from "./supabase";

export type AuthTokenKind = "verify" | "reset";

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAuthToken(
  userId: number,
  kind: AuthTokenKind,
  hours = 24
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  // Only the newest link of each kind stays usable.
  await db()
    .from("auth_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("kind", kind);
  const { error } = await db().from("auth_tokens").insert({
    user_id: userId,
    token_hash: hash(token),
    kind,
    expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
  });
  if (error) throw error;
  return token;
}

/** Returns the user id for a valid token, or null. Marks the token used. */
export async function consumeAuthToken(
  token: string,
  kind: AuthTokenKind
): Promise<number | null> {
  const { data, error } = await db()
    .from("auth_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", hash(token))
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw error;
  const row = data as unknown as
    | { id: number; user_id: number; expires_at: string; used_at: string | null }
    | null;
  if (!row || row.used_at || new Date(row.expires_at).getTime() <= Date.now()) return null;

  const updated = await db()
    .from("auth_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id);
  const result = updated as unknown as { error?: unknown };
  return result?.error ? null : num(row.user_id);
}

/** Six-digit OTP for signup verification, hashed at rest, 10-minute life. */
export async function issueOtp(userId: number): Promise<string> {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await db()
    .from("auth_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("kind", "verify");
  const { error } = await db().from("auth_tokens").insert({
    user_id: userId,
    token_hash: hash(`otp:${userId}:${otp}`),
    kind: "verify",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (error) throw error;
  return otp;
}

export async function consumeOtp(userId: number, otp: string): Promise<boolean> {
  const { data, error } = await db()
    .from("auth_tokens")
    .select("id, expires_at, used_at")
    .eq("user_id", userId)
    .eq("token_hash", hash(`otp:${userId}:${otp.trim()}`))
    .eq("kind", "verify")
    .maybeSingle();
  if (error) throw error;
  const row = data as unknown as { id: number; expires_at: string; used_at: string | null } | null;
  if (!row || row.used_at || new Date(row.expires_at).getTime() <= Date.now()) return false;
  const updated = await db()
    .from("auth_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id);
  return !(updated as unknown as { error?: unknown })?.error;
}

export async function isEmailVerified(userId: number): Promise<boolean> {
  const { data } = await db()
    .from("user_auth_meta")
    .select("email_verified")
    .eq("user_id", userId)
    .maybeSingle();
  // Accounts created before verification existed are treated as verified.
  if (!data) return true;
  return Boolean((data as { email_verified?: unknown }).email_verified);
}

export async function markEmailVerified(userId: number): Promise<void> {
  const { error } = await db().from("user_auth_meta").upsert(
    { user_id: userId, email_verified: true },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function findUserByGoogleSub(sub: string): Promise<number | null> {
  const { data } = await db()
    .from("user_auth_meta")
    .select("user_id")
    .eq("google_sub", sub)
    .maybeSingle();
  return data ? num((data as unknown as { user_id: unknown }).user_id) : null;
}

export async function linkGoogleAccount(userId: number, sub: string): Promise<void> {
  const { error } = await db().from("user_auth_meta").upsert(
    { user_id: userId, email_verified: true, google_sub: sub },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

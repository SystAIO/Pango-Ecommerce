/**
 * Supabase client — server only (this package is the backend; never import it
 * into the frontend app).
 *
 * Replaces the old `mysql2` connection pool. See `lib/supabase.ts` for the full
 * note on why the app now uses the query builder and Postgres functions instead
 * of hand-written SQL.
 *
 * The client is created lazily rather than at module scope so that importing this
 * file never throws. Several pages (notably the homepage) degrade gracefully when
 * Supabase is not configured yet, and that only works if `createClient` is not
 * called until something actually needs it.
 *
 * SECURITY: the service-role key bypasses row-level security. It must only ever
 * be read on the backend, never shipped to the frontend.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/** Accepts SUPABASE_URL, falling back to the legacy NEXT_PUBLIC_SUPABASE_URL name. */
function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * The shared Supabase client.
 *
 * @throws if `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing.
 *         Call `isSupabaseConfigured()` first in code paths that must not crash.
 */
export function db(): SupabaseClient {
  if (!cached) {
    const url = supabaseUrl();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Supabase is not configured. Set SUPABASE_URL and " +
          "SUPABASE_SERVICE_ROLE_KEY in .env (see .env.example), then apply " +
          "supabase/schema.sql and supabase/seed.sql."
      );
    }

    cached = createClient(url, key, {
      auth: {
        // We issue our own JWTs via /api/auth/*, so supabase-js session
        // persistence would only get in the way.
        persistSession: false,
        autoRefreshToken: false,
      },
      global: { headers: { "x-application-name": "ecommerce-storefront" } },
    });
  }

  return cached;
}

export default db;

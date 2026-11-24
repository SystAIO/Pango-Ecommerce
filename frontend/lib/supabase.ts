/**
 * Shared PostgREST value helpers.
 *
 * `numeric` columns arrive as strings over PostgREST, so `toProduct()` and
 * friends normalise them to numbers with `num()`. These helpers are pure and
 * safe to ship to the browser; the Supabase service-role client itself lives
 * in the backend only.
 */

/**
 * Coerces a Postgres value to a number.
 *
 * Typed as `unknown` on purpose: PostgREST returns `numeric` columns as strings,
 * but the row itself is untyped here, so callers pass whatever the query builder
 * gave back. `Number()` handles both, and the `isFinite` check catches `null`
 * (which `Number(null)` turns into a misleading 0) and `NaN`.
 */
export function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Postgres has no single JSON column type; jsonb can arrive as an object or a string. */
export function json<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

/**
 * PostgREST rows are untyped unless the project has generated database types
 * (`supabase gen types typescript`). Casting through `unknown` keeps one
 * `as` out of every call site, and keeps this one function as the place to
 * switch to generated types later.
 */
export function asRows<T>(value: unknown): T[] {
  return (value as T[]) ?? [];
}

export function asRow<T>(value: unknown): T {
  return value as T;
}

/**
 * Turns a PostgREST error into a message worth showing a developer in the
 * terminal. PostgREST errors arrive as `{}` for network failures, so the raw
 * object alone is not much use in a log line.
 */
export function describeError(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  const e = error as { message?: string; code?: string; details?: string; hint?: string };
  return [e.code, e.message, e.details, e.hint].filter(Boolean).join(" — ") || "Unknown error";
}

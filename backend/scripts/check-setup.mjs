/**
 * Pre-flight check. Reports exactly which setup steps are still outstanding
 * instead of making you guess.
 *
 *   node --env-file=.env.local scripts/check-setup.mjs
 *
 * Exits 0 whenever it can reach Supabase, even if steps remain — a non-zero code
 * would be unhelpful in CI, where this is a report, not a gate.
 */
import { createClient } from "@supabase/supabase-js";

const ok = (m) => console.log("  OK      " + m);
const bad = (m) => console.log("  MISSING " + m);
const warn = (m) => console.log("  WARN    " + m);
const info = (m) => console.log("  ....    " + m);

/** Steps still outstanding, collected so the summary can list them in order. */
const todo = [];

/**
 * PostgREST phrases a missing relation differently depending on version
 * ("does not exist" vs "not found in the schema cache"), so match both.
 */
const isMissingTable = (msg) => /does not exist/i.test(msg) || /schema cache/i.test(msg);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in .env.local");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ── 1. Connection ──────────────────────────────────────────────────────── */
console.log("\n1. Supabase connection");

const probe = await db.from("users").select("id").limit(1);
if (!probe.error) {
  ok("connected");
} else if (isMissingTable(probe.error.message)) {
  ok("connected - the credentials are valid, there are just no tables yet");
} else {
  bad("cannot reach Supabase: " + probe.error.message);
  await db.removeAllChannels();
  process.exit(1);
}

/* ── 2. Core schema ─────────────────────────────────────────────────────── */
console.log("\n2. Core schema   ->  supabase/schema.sql");

const CORE = [
  "users",
  "products",
  "customer_orders",
  "customer_order_items",
  "favorites",
  "addresses",
];
const missingCore = [];

for (const table of CORE) {
  const { error } = await db.from(table).select("id").limit(1);
  if (!error) ok(table);
  else if (isMissingTable(error.message)) {
    bad(`${table}  - table not created`);
    missingCore.push(table);
  } else bad(`${table}  - ${error.message}`);
}

const coreReady = missingCore.length === 0;
if (!coreReady) todo.push("Apply supabase/schema.sql in the Supabase SQL editor");

/* ── 3. Catalogue ───────────────────────────────────────────────────────── */
console.log("\n3. Catalogue   ->  supabase/seed.sql");
let productCount = 0;

if (coreReady) {
  const res = await db.from("products").select("id", { count: "exact", head: true });
  productCount = res.count ?? 0;

  if (productCount > 0) {
    ok(`${productCount} products loaded`);
    const { data: sample } = await db.from("products").select("name").limit(3);
    for (const p of sample ?? []) info("  " + p.name);
  } else {
    bad("no products");
    todo.push("Load supabase/seed.sql (paste it into the Supabase SQL editor)");
  }
} else {
  info("skipped - core schema not applied yet");
}

/* ── 4. Vector store ────────────────────────────────────────────────────── */
console.log("\n4. Vector store   ->  supabase/rag.sql");
/* Sections 4 and 5 used to check the assistant's vector store and Groq key.
   The assistant has been removed from the app, so those checks are gone; the
   `knowledge_chunks` table / match_knowledge function in the database can be
   dropped with `drop table public.knowledge_chunks;` and
   `drop function if exists public.match_knowledge;` if you want them gone. */

/* ── 6. Admin account ───────────────────────────────────────────────────── */
console.log("\n6. Admin account");

if (!coreReady) {
  info("skipped - core schema not applied yet");
} else {
  const { data: admins } = await db.from("users").select("email").eq("role", "admin");

  if (admins && admins.length > 0) {
    for (const a of admins) ok("admin: " + a.email);
  } else {
    bad("no admin account exists");
    info("sign up at /signup, then run supabase/admin.sql to promote yourself");
    todo.push("Create an admin: sign up at /signup, then run supabase/admin.sql");
  }

  const { count: users } = await db
    .from("users")
    .select("id", { count: "exact", head: true });
  info(`accounts registered: ${users ?? 0}`);
}

/* ── Summary ────────────────────────────────────────────────────────────── */
console.log("\n" + "=".repeat(66));
if (todo.length === 0) {
  console.log("Everything is ready. Run `npm run dev` and open the site.");
} else {
  console.log(`Still to do (${todo.length}):\n`);
  todo.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
}
console.log("=".repeat(66));

await db.removeAllChannels();
process.exit(0);
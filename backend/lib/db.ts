/**
 * Local PostgreSQL data access.
 *
 * This replaces the Supabase REST client with a `pg` connection pool, but keeps
 * the small part of the supabase-js query-builder API the routes actually use
 * (`.from().select().eq().order()` … and `.rpc()`). No route code had to change.
 *
 * SECURITY: all values are parameterised. Table/column names come only from
 * our own source code, never from request input.
 */

import { Pool } from "pg";

/** Array on normal selects, object on single()/rpc() — both shapes type-check. */
export type DbData = any[] & Record<string, any>;
export type DbResult = { data: DbData; error: any; count?: number | null };

let pool: Pool | null = null;

function connectionString(): string {
  return String(process.env.DATABASE_URL ?? "").trim();
}

/** True when a local Postgres connection string is configured. */
export function isSupabaseConfigured(): boolean {
  return Boolean(connectionString());
}
export const isDatabaseConfigured = isSupabaseConfigured;

function getPool(): Pool {
  if (!pool) {
    const url = connectionString();
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add it to backend/.env, e.g. " +
          "DATABASE_URL=postgres://pango:password@127.0.0.1:5432/pango_ecommerce"
      );
    }
    pool = new Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30000 });
    // A bad connection should not crash the process.
    pool.on("error", (error) => console.error("Postgres pool error:", error.message));
  }
  return pool;
}

const KNOWN_PREFIXES = ["PRODUCT_UNAVAILABLE", "PRICED_ON_REQUEST", "AMOUNT_MISMATCH", "NO_VALID_ITEMS"];

function toError(error: unknown): any {
  const err = error as { code?: string; message?: string; detail?: string; hint?: string };
  const message = String(err?.message ?? "Database error");
  // Order functions RAISE a message the routes match with startsWith(...), so
  // leave those untouched; prefix everything else with the SQLSTATE so the
  // existing 23505 / 42P01 checks keep working.
  const prefixed = KNOWN_PREFIXES.some((p) => message.includes(p))
    ? message
    : `${err?.code ?? "ERROR"}: ${message}`;
  return {
    code: err?.code,
    message: prefixed,
    details: err?.detail,
    hint: err?.hint,
  };
}

function quoteIdent(name: string): string {
  return `"${String(name).replace(/"/g, '""')}"`;
}

/**
 * `pg` sends JS arrays as Postgres array literals (`{"a","b"}`), but every
 * structured column/argument in this schema is `json`/`jsonb`, which needs
 * JSON (`["a","b"]`). Postgres rejects the array literal with `22P02`, so
 * stringify those values before binding them. Scalars, Dates and Buffers are
 * left to `pg` so numeric/boolean/uuid/timestamptz parameters keep their
 * native handling.
 */
export function jsonValue(value: any): any {
  if (value === null || value === undefined) return null;
  const isArray = Array.isArray(value);
  const isPlainObject =
    typeof value === "object" && (value.constructor === Object || value.constructor === undefined);
  return isArray || isPlainObject ? JSON.stringify(value) : value;
}

type Filter =
  | { kind: "eq" | "neq" | "gt"; column: string; value: any }
  | { kind: "in"; column: string; value: any[] }
  | { kind: "or"; clauses: { column: string; op: "ilike" | "eq"; value: any }[] };

type Operation = "select" | "insert" | "update" | "delete" | "upsert";

class QueryBuilder implements PromiseLike<DbResult> {
  private params: any[] = [];
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private mode: "array" | "single" | "maybeSingle" = "array";
  private countOnly = false;
  private embedded?: { table: string; columns: string | null };

  constructor(
    private table: string,
    private operation: Operation,
    private columns: string = "*",
    private payload?: any,
    private upsertKey?: string,
    private head = false
  ) {
    const embeddedMatch = String(columns).match(/,\s*([a-z_][a-z0-9_]*)\s*\(([^)]*)\)\s*$/i);
    if (embeddedMatch) {
      this.embedded = { table: embeddedMatch[1], columns: embeddedMatch[2].trim() || null };
      this.columns = String(columns).replace(embeddedMatch[0], "").replace(/,\s*$/, "").trim() || "*";
    }
  }

  private param(value: any): string {
    this.params.push(value);
    return `$${this.params.length}`;
  }

  eq(column: string, value: any): this {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }
  neq(column: string, value: any): this {
    this.filters.push({ kind: "neq", column, value });
    return this;
  }
  gt(column: string, value: any): this {
    this.filters.push({ kind: "gt", column, value });
    return this;
  }
  in(column: string, value: any[]): this {
    this.filters.push({ kind: "in", column, value: Array.isArray(value) ? value : [value] });
    return this;
  }

  /** Parses PostgREST's `a.ilike.x,b.eq.y` filter syntax. */
  or(expression: string): this {
    const clauses: { column: string; op: "ilike" | "eq"; value: any }[] = [];
    for (const part of String(expression ?? "").split(",")) {
      const match = part.trim().match(/^([a-z_][a-z0-9_]*)\.(ilike|eq)\.(.+)$/i);
      if (!match) continue;
      clauses.push({ column: match[1], op: match[2].toLowerCase() as "ilike" | "eq", value: match[3] });
    }
    if (clauses.length) this.filters.push({ kind: "or", clauses });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }
  limit(value: number): this {
    this.limitValue = Math.max(0, Number(value) || 0);
    return this;
  }
  range(from: number, to: number): this {
    this.offsetValue = Math.max(0, Number(from) || 0);
    this.limitValue = Math.max(0, (Number(to) || 0) - this.offsetValue + 1);
    return this;
  }
  maybeSingle(): this {
    this.mode = "maybeSingle";
    return this;
  }
  single(): this {
    this.mode = "single";
    return this;
  }

  /** Called after insert/update/upsert to request RETURNING rows. */
  select(columns?: string): this {
    // supabase-js allows `.insert(...).select("id")` to narrow RETURNING cols.
    if (columns && this.operation !== "select") this.columns = columns;
    this.countOnly = this.head;
    return this;
  }

  private singleResult(rows: any[]): DbData {
    if (this.mode !== "array") return (rows[0] ?? null) as unknown as DbData;
    return rows as unknown as DbData;
  }

  private whereClause(alias: string): string {
    const parts: string[] = [];
    for (const filter of this.filters) {
      const col =
        filter.kind === "or"
          ? ""
          : alias
            ? `${alias}.${quoteIdent(filter.column)}`
            : quoteIdent(filter.column);
      if (filter.kind === "in") {
        if (!filter.value.length) {
          parts.push("FALSE");
        } else {
          parts.push(`${col} = ANY(${this.param(filter.value)})`);
        }
      } else if (filter.kind === "or") {
        const ors = filter.clauses.map((clause) => {
          const column = alias ? `${alias}.${quoteIdent(clause.column)}` : quoteIdent(clause.column);
          return clause.op === "ilike"
            ? `${column} ILIKE ${this.param(`%${clause.value}%`)}`
            : `${column} = ${this.param(clause.value)}`;
        });
        if (ors.length) parts.push(`(${ors.join(" OR ")})`);
      } else {
        const op = filter.kind === "eq" ? "=" : filter.kind === "neq" ? "<>" : ">";
        parts.push(`${col} ${op} ${this.param(filter.value)}`);
      }
    }
    return parts.length ? ` WHERE ${parts.join(" AND ")}` : "";
  }

  private selectColumns(alias: string): string {
    const cols = String(this.columns || "*")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((c) => (c === "*" ? `${alias}.*` : `${alias}.${quoteIdent(c)}`));
    return cols.length ? cols.join(", ") : `${alias}.*`;
  }

  private returningColumns(): string {
    const cols = String(this.columns || "*")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((c) => (c === "*" ? "*" : quoteIdent(c)));
    return cols.length ? cols.join(", ") : "*";
  }

  private async execute(): Promise<DbResult> {
    this.params = [];
    const table = quoteIdent(this.table);

    try {
      if (this.countOnly) {
        const sql = `SELECT COUNT(*)::int AS n FROM ${table}${this.whereClause("t")}`;
        const result = await getPool().query(sql, this.params);
        return { data: null as unknown as DbData, count: Number(result.rows[0]?.n ?? 0), error: null };
      }

      if (this.operation === "select") {
        const embedded = this.embedded;
        const alias = embedded ? "t" : quoteIdent(this.table);
        let sql: string;

        if (embedded) {
          const joinTable = quoteIdent(embedded.table);
          const embeddedCols = embedded.columns
            ? embedded.columns.split(",").map((c) => quoteIdent(c.trim())).join(", ")
            : "*";
          sql =
            `SELECT ${this.selectColumns("t")}, ` +
            `(CASE WHEN e.id IS NULL THEN NULL ELSE to_jsonb(e) END) AS ${quoteIdent(embedded.table)} ` +
            `FROM ${table} t LEFT JOIN ${joinTable} e ON e.id = t.product_id` +
            this.whereClause("t");
          void embeddedCols;
        } else {
          sql = `SELECT ${this.selectColumns(alias)} FROM ${table} AS ${alias}${this.whereClause(alias)}`;
        }

        if (this.orders.length) {
          sql += " ORDER BY " + this.orders
            .map((o) => `${embedded ? "t" : alias}.${quoteIdent(o.column)} ${o.ascending ? "ASC" : "DESC"}`)
            .join(", ");
        }
        if (this.limitValue !== undefined) sql += ` LIMIT ${this.limitValue}`;
        if (this.offsetValue !== undefined) sql += ` OFFSET ${this.offsetValue}`;

        const result = await getPool().query(sql, this.params);
        let rows = result.rows;
        if (this.mode === "single" && rows.length === 0) {
          return { data: null as unknown as DbData, error: { code: "PGRST116", message: "PGRST116: no rows returned" } };
        }
        if (this.mode !== "array") rows = rows.slice(0, 1);
        return { data: this.mode === "array" ? rows : rows[0] ?? null, error: null };
      }

      const wantsReturning = this.params.length >= 0 && (this as any)._returning !== false;
      if (this.operation === "insert" || this.operation === "upsert") {
        const rows: any[] = Array.isArray(this.payload) ? this.payload : [this.payload];
        if (!rows.length) return { data: [], error: null };
        const keys = [...new Set(rows.flatMap((r) => Object.keys(r ?? {})))];
        const columns = keys.map(quoteIdent).join(", ");
        const values = rows.map((row) => `(${keys.map((k) => this.param(jsonValue(row[k] ?? null))).join(", ")})`).join(", ");
        let sql = `INSERT INTO ${table} (${columns}) VALUES ${values}`;
        if (this.operation === "upsert" && this.upsertKey) {
          const updates = keys.filter((k) => k !== this.upsertKey).map((k) => `${quoteIdent(k)} = EXCLUDED.${quoteIdent(k)}`);
          sql += ` ON CONFLICT (${quoteIdent(this.upsertKey)}) DO UPDATE SET ${updates.join(", ")}`;
        }
        if (wantsReturning) sql += ` RETURNING ${this.returningColumns()}`;
        const result = await getPool().query(sql, this.params);
        return {
          data: wantsReturning ? this.singleResult(result.rows) : (null as unknown as DbData),
          error: null,
        };
      }

      if (this.operation === "update" || this.operation === "delete") {
        let sql: string;
        if (this.operation === "update") {
          const values = this.payload ?? {};
          const keys = Object.keys(values);
          if (!keys.length) return { data: [], error: null };
          const set = keys.map((k) => `${quoteIdent(k)} = ${this.param(jsonValue(values[k]))}`).join(", ");
          sql = `UPDATE ${table} SET ${set}${this.whereClause("")}`;
        } else {
          sql = `DELETE FROM ${table}${this.whereClause("")}`;
        }
        if (wantsReturning) sql += ` RETURNING ${this.returningColumns()}`;
        const result = await getPool().query(sql, this.params);
        return {
          data: wantsReturning ? this.singleResult(result.rows) : (null as unknown as DbData),
          error: null,
        };
      }

      return { data: null as unknown as DbData, error: null };
    } catch (error) {
      return { data: null as unknown as DbData, error: toError(error) };
    }
  }

  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class TableBuilder {
  constructor(private table: string) {}

  select(columns: string = "*", options?: { count?: string; head?: boolean }): QueryBuilder {
    return new QueryBuilder(this.table, "select", columns, undefined, undefined, options?.head === true && options?.count === "exact");
  }
  insert(payload: any): QueryBuilder {
    return new QueryBuilder(this.table, "insert", "*", payload);
  }
  update(payload: any): QueryBuilder {
    return new QueryBuilder(this.table, "update", "*", payload);
  }
  delete(): QueryBuilder {
    return new QueryBuilder(this.table, "delete");
  }
  upsert(payload: any, options?: { onConflict?: string }): QueryBuilder {
    return new QueryBuilder(this.table, "upsert", "*", payload, options?.onConflict);
  }
}

let argTypesCache: Record<string, { name: string; type: string }[]> | null = null;

async function functionArgs(name: string): Promise<{ name: string; type: string }[]> {
  if (!argTypesCache) argTypesCache = {};
  if (argTypesCache[name]) return argTypesCache[name];
  const result = await getPool().query(
    // identity arguments omit DEFAULT expressions. pg_get_function_arguments()
    // appends them, which produces invalid `$1::boolean DEFAULT false` SQL.
    `SELECT pg_get_function_identity_arguments(p.oid) AS args
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = $1 AND n.nspname = 'public' LIMIT 1`,
    [name]
  );
  const raw = String(result.rows[0]?.args ?? "");
  const parsed = raw
    .split(/,\s*(?=[a-z_][a-z0-9_]*\s+)/i)
    .map((part) => part.trim().match(/^([a-z_][a-z0-9_]*)\s+(.+)$/i))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ name: m[1].toLowerCase(), type: m[2].trim() }));
  argTypesCache[name] = parsed;
  return parsed;
}

export type DatabaseClient = {
  from: (table: string) => TableBuilder;
  rpc: (name: string, args?: Record<string, any>) => Promise<DbResult>;
  removeAllChannels: () => Promise<void>;
};

const client: DatabaseClient = {
  from: (table: string) => new TableBuilder(table),
  removeAllChannels: async () => {},

  async rpc(name: string, args: Record<string, any> = {}) {
    try {
      const argsInfo = await functionArgs(name);
      const params: any[] = [];
      let i = 0;
      const placeholders = argsInfo.map((arg) => {
        const value = args[arg.name];
        if (value === undefined || value === null) return `NULL::${arg.type}`;
        // jsonb arguments (order lines, addresses) have the same array problem.
        params.push(/\bjsonb?\b/i.test(arg.type) ? jsonValue(value) : value);
        i += 1;
        return `$${i}::${arg.type}`;
      });

      const sql = `SELECT * FROM ${quoteIdent("public")}.${quoteIdent(name)}(${placeholders.join(", ")})`;
      const result = await getPool().query(sql, params);
      const row = result.rows[0];
      const data = row
        ? Object.keys(row).length === 1
          ? row[Object.keys(row)[0]]
          : row
        : null;
      return { data, error: null };
    } catch (error) {
      return { data: null as unknown as DbData, error: toError(error) };
    }
  },
};

export function db(): DatabaseClient {
  // Touch the pool lazily only when a real query runs; db() itself stays sync.
  return client;
}

export default db;

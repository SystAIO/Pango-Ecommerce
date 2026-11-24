"use client";

/** Admin → Inventory Management: stock, valuation and sales per product. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Loader2, Package, RefreshCw, Search, Wallet, AlertTriangle } from "lucide-react";
import { inr } from "@/lib/site";

type Variant = { color: string; size: string; quantity: number };

type InventoryRow = {
  key: string;
  source: "product" | "combo" | "collection";
  sourceLabel: string;
  variants: Variant[];
  id: number;
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  mrp: number;
  stock: number;
  image_url: string | null;
  badge: string;
  is_featured: boolean;
  created_at: string;
  sold_units: number;
  revenue: number;
  stock_value: number;
};

type Summary = {
  products: number;
  categories: number;
  total_stock: number;
  stock_value: number;
  sold_units: number;
  revenue: number;
  low_stock: number;
  out_of_stock: number;
};

const PAGE = 10;

function stockTone(stock: number) {
  return stock === 0 ? "bg-rose-50 text-rose-700" : stock <= 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
}

function StatCard({ label, value, sub, icon: Icon, tone }: { label: string; value: string; sub?: string; icon: typeof Package; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
          {sub ? <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p> : null}
        </div>
        <span className={`rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></span>
      </div>
    </div>
  );
}

export default function InventoryManager() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draftStock, setDraftStock] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load inventory");
      setRows(data.items ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const categories = useMemo(() => [...new Set(rows.map((r) => r.category))].sort(), [rows]);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (search && !`${r.name} ${r.slug} ${r.brand}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "all" && r.source !== category) return false;
      if (stockFilter === "low" && !(r.stock > 0 && r.stock <= 10)) return false;
      if (stockFilter === "out" && r.stock !== 0) return false;
      if (stockFilter === "in" && r.stock <= 10) return false;
      return true;
    });
    list = [...list];
    if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    if (sort === "stock-low") list.sort((a, b) => a.stock - b.stock);
    if (sort === "sold") list.sort((a, b) => b.sold_units - a.sold_units);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "newest") list.sort((a, b) => b.id - a.id);
    return list;
  }, [rows, search, category, stockFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE, safePage * PAGE);

  const saveStock = async (row: InventoryRow) => {
    // Combos and collections have no products row to PATCH — their stock comes
    // from the per-variant editors on their own screens.
    if (row.source !== "product" || row.id <= 0) {
      setNotice("Edit this item's stock in its colour/size editor instead.");
      return;
    }
    const value = Number(draftStock);
    if (!Number.isFinite(value) || value < 0) { setNotice("Enter a valid stock number."); return; }
    try {
      const res = await fetch(`/api/admin/inventory/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stock: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update stock");
      setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, stock: Math.floor(value) } : r)));
      setEditing(null);
      setNotice("Stock updated.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update stock");
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading inventory…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Inventory Management</h2>
          <p className="mt-1 text-xs text-slate-500">Every product in stock, its value, and how many units have been sold.</p>
          {notice ? <p className="mt-1 text-[11px] font-semibold text-orange-600">{notice}</p> : null}
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" value={String(summary?.products ?? 0)} sub={`${summary?.categories ?? 0} categories`} icon={Package} tone="bg-orange-50 text-orange-600" />
        <StatCard label="Stock on hand" value={String(summary?.total_stock ?? 0)} sub={inr(summary?.stock_value ?? 0) + " at cost"} icon={ArrowUp} tone="bg-emerald-50 text-emerald-600" />
        <StatCard label="Units sold" value={String(summary?.sold_units ?? 0)} icon={ArrowDown} tone="bg-sky-50 text-sky-600" />
        <StatCard label="Sales revenue" value={inr(summary?.revenue ?? 0)} sub={`${summary?.low_stock ?? 0} low · ${summary?.out_of_stock ?? 0} out`} icon={Wallet} tone="bg-violet-50 text-violet-600" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search product, slug or brand…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-orange-500" />
          </label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold">
            <option value="all">All sources</option>
            <option value="product">Catalogue products</option>
            <option value="combo">Combos</option>
            <option value="collection">New Arrivals / Winterwear</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold">
            <option value="all">All stock</option>
            <option value="in">In stock (&gt;10)</option>
            <option value="low">Low stock (1–10)</option>
            <option value="out">Out of stock</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold">
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="stock-low">Lowest stock</option>
            <option value="sold">Most sold</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Sold</th>
                <th className="px-3 py-3">Revenue</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((row) => (
                <tr key={row.key} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {row.image_url ? <img src={row.image_url} alt="" className="h-full w-full object-cover" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-slate-800">{row.name}</span>
                        <span className="block truncate text-[10px] text-slate-400">{row.slug}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{row.sourceLabel}</span>
                    <span className="mt-1 block text-[10px] text-slate-400">{row.category}</span>
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-slate-800">{inr(row.price)}</td>
                  <td className="px-3 py-3">
                    {row.source !== "product" ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${stockTone(row.stock)}`} title={`Stock is set per colour/size in the ${row.sourceLabel} editor`}>
                        {row.stock === 0 ? <AlertTriangle className="h-3 w-3" /> : null}{row.stock}
                      </span>
                    ) : editing === row.id ? (
                      <span className="flex items-center gap-1">
                        <input type="number" min={0} value={draftStock} onChange={(e) => setDraftStock(e.target.value)} className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs" />
                        <button type="button" onClick={() => void saveStock(row)} className="rounded-lg bg-orange-600 px-2 py-1.5 text-[10px] font-bold text-white">Save</button>
                        <button type="button" onClick={() => setEditing(null)} className="text-[10px] text-slate-400">✕</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => { setEditing(row.id); setDraftStock(String(row.stock)); }} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${stockTone(row.stock)}`} title="Click to edit stock">
                        {row.stock === 0 ? <AlertTriangle className="h-3 w-3" /> : null}{row.stock}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-700">{row.sold_units}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-800">{inr(row.revenue)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {row.variants.length > 0 ? (
                        <button type="button" onClick={() => setExpanded(expanded === row.key ? null : row.key)} className="text-[11px] font-bold text-sky-700 hover:underline">
                          {expanded === row.key ? "Hide" : `Variants (${row.variants.length})`}
                        </button>
                      ) : null}
                      <Link href={row.source === "product" ? `/product/${row.slug}` : `/product-page`} target="_blank" className="text-[11px] font-bold text-orange-600 hover:underline">View ↗</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.map((row) => expanded === row.key && row.variants.length > 0 ? (
                <tr key={`${row.key}-variants`}>
                  <td colSpan={7} className="bg-slate-50 px-4 py-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Stock by colour &amp; size</p>
                    <div className="flex flex-wrap gap-2">
                      {row.variants.map((v, i) => (
                        <span key={i} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700">
                          {v.color || "—"} / {v.size || "—"} <b className="ml-1 text-slate-900">{v.quantity}</b>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : null)}
              {visible.length === 0 ? <tr><td colSpan={7} className="px-3 py-10 text-center text-xs text-slate-400">No products match these filters.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE + 1}–{Math.min(safePage * PAGE, filtered.length)} of {filtered.length} products
          </p>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setPage(1)} disabled={safePage === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">First</button>
            <button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
            <span className="px-2 text-xs font-bold text-slate-600">{safePage} / {totalPages}</span>
            <button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Last</button>
          </div>
        </div>
      </div>
    </div>
  );
}

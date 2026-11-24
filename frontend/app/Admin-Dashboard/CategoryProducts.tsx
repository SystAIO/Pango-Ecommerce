"use client";

/** Admin → Manage Inventory → Topwear / Bottomwear: size-only stock per category product. */

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Package, RefreshCw } from "lucide-react";
import VariantStockEditor from "@/app/components/VariantStockEditor";
import type { NavbarMenu, NavbarMenuSection } from "@/lib/navbar-menu";
import { DEFAULT_MENU } from "@/lib/navbar-menu";
import { inr } from "@/lib/site";

type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: number;
  image_url: string | null;
};

type Variant = { color: string; size: string; quantity: number };

const NAV_LABELS = new Set(["view all", "topwear", "bottomwear", "winterwear", "shop for women"]);

function categoryNames(section: NavbarMenuSection): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const col of section?.columns ?? []) {
    for (const raw of col.items) {
      const item = raw.trim();
      const lower = item.toLowerCase();
      if (!item || NAV_LABELS.has(lower) || lower.startsWith("all ") || seen.has(lower)) continue;
      seen.add(lower);
      out.push(item);
    }
  }
  return out;
}

export default function CategoryProducts({ group, label }: { group: "topwear" | "bottomwear"; label: string }) {
  const [menu, setMenu] = useState<NavbarMenu>(DEFAULT_MENU);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Record<number, Variant[]>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setNotice("");
    try {
      const [menuRes, productsRes] = await Promise.all([
        fetch("/api/navbar-menu", { credentials: "include" }),
        fetch("/api/products?limit=500"),
      ]);
      const m: NavbarMenu | null = menuRes.ok ? await menuRes.json() : null;
      if (m) setMenu(m);
      const p = productsRes.ok ? await productsRes.json() : { products: [] };
      const all: Product[] = (p.products ?? []).map((x: any) => ({
        id: Number(x.id),
        name: String(x.name ?? ""),
        slug: String(x.slug ?? ""),
        category: String(x.category ?? ""),
        price: Number(x.price) || 0,
        image_url: x.image_url ?? null,
      }));
      setProducts(all);

      const ids = all.map((x) => x.id).filter((id) => Number.isFinite(id) && id > 0);
      const entries = await Promise.all(
        ids.map(async (id) => {
          const r = await fetch(`/api/admin/variant-stock?key=${encodeURIComponent(`product:${id}`)}`, { credentials: "include" });
          const d = await r.json();
          return [id, d.variants ?? []] as const;
        })
      );
      setStocks(Object.fromEntries(entries));
    } catch {
      setNotice("Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const categories = useMemo(() => categoryNames(menu[group] ?? DEFAULT_MENU[group]), [menu, group]);
  const activeCategory = category || categories[0] || "";

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const name of categories) map.set(name, []);
    for (const p of products) {
      const key = categories.find((c) => c.toLowerCase() === p.category.trim().toLowerCase());
      if (key) map.get(key)!.push(p);
    }
    return map;
  }, [categories, products]);

  const visible = grouped.get(activeCategory) ?? [];

  const totals = useMemo(() => {
    let units = 0;
    let withStock = 0;
    visible.forEach((p) => {
      const sum = (stocks[p.id] ?? []).reduce((n, v) => n + Math.max(0, v.quantity), 0);
      units += sum;
      if (sum > 0) withStock++;
    });
    return { units, withStock };
  }, [visible, stocks]);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading {label} products…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">{label} Products</h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage stock by size for each product. Categories come from Customize Navbar → {label}.
          </p>
          {notice ? <p className="mt-1 text-[11px] font-semibold text-orange-600">{notice}</p> : null}
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => { setCategory(name); setOpen(null); }}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
              activeCategory === name ? "border-orange-600 bg-orange-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-orange-400"
            }`}
          >
            {name} <span className="opacity-70">({(grouped.get(name) ?? []).length})</span>
          </button>
        ))}
        {categories.length === 0 ? <p className="text-[11px] text-slate-400">No categories defined — add items in Customize Navbar → {label}.</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Products", value: visible.length },
          { label: "Products with stock", value: totals.withStock },
          { label: "Total units", value: totals.units },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="mt-1 text-xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((p) => {
          const rows = stocks[p.id] ?? [];
          const total = rows.reduce((n, v) => n + Math.max(0, v.quantity), 0);
          const expanded = open === p.id;
          const sizeCount = rows.filter((r) => r.size).length;
          return (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => setOpen(expanded ? null : p.id)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{p.name}</span>
                  <span className="block text-[10px] text-slate-400">{p.category} · {inr(p.price)} · {sizeCount} sizes</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${total === 0 ? "bg-rose-50 text-rose-700" : total <= 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {total} units
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded ? (
                <div className="border-t border-slate-100 p-4">
                  <VariantStockEditor
                    stockKey={`product:${p.id}`}
                    sizeOnly
                    label={`Stock by size — ${p.name}`}
                    onSaved={() => void load()}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
        {visible.length === 0 ? <p className="rounded-2xl bg-white p-8 text-center text-xs text-slate-400">No products in this category yet.</p> : null}
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><Package className="h-3 w-3" /> Stock changes appear in Inventory Management under Catalogue products.</p>
    </div>
  );
}

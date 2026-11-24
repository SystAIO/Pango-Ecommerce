"use client";

/** Manage Inventory → New Arrivals / Winterwear: per-product colour & size stock. */

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Package, RefreshCw } from "lucide-react";
import type { CollectionData, CollectionItem, CollectionKey } from "@/lib/collection-data";
import { DEFAULT_COLLECTIONS } from "@/lib/collection-data";
import { inr } from "@/lib/site";
import VariantStockEditor from "@/app/components/VariantStockEditor";

type Variant = { color: string; size: string; quantity: number };

export default function CollectionInventory({ collectionKey, label }: { collectionKey: CollectionKey; label: string }) {
  const [data, setData] = useState<CollectionData>(DEFAULT_COLLECTIONS[collectionKey]);
  const [stocks, setStocks] = useState<Record<string, Variant[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/collections/${collectionKey}`, { credentials: "include" });
      const cData: CollectionData = res.ok ? await res.json() : DEFAULT_COLLECTIONS[collectionKey];
      setData(cData);
      const entries = await Promise.all(
        cData.items.map(async (item) => {
          const key = `collection:${collectionKey}:${item.slug}`;
          const r = await fetch(`/api/admin/variant-stock?key=${encodeURIComponent(key)}`, { credentials: "include" });
          const d = await r.json();
          return [key, d.variants ?? []] as const;
        })
      );
      setStocks(Object.fromEntries(entries));
    } catch {
      setNotice("Could not load stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [collectionKey]);

  const totals = useMemo(() => {
    let units = 0;
    let withStock = 0;
    data.items.forEach((item) => {
      const key = `collection:${collectionKey}:${item.slug}`;
      const sum = (stocks[key] ?? []).reduce((n, v) => n + Math.max(0, v.quantity), 0);
      units += sum;
      if (sum > 0) withStock++;
    });
    return { units, withStock };
  }, [data.items, stocks, collectionKey]);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading {label} stock…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">{label} Inventory</h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage the quantity available in each size and colour for every {label} product. Set them
            here or in Manage Products — both feed Inventory Management.
          </p>
          {notice ? <p className="mt-1 text-[11px] font-semibold text-orange-600">{notice}</p> : null}
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Products", value: data.items.length },
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
        {data.items.map((item: CollectionItem) => {
          const key = `collection:${collectionKey}:${item.slug}`;
          const rows = stocks[key] ?? [];
          const total = rows.reduce((n, v) => n + Math.max(0, v.quantity), 0);
          const expanded = open === key;
          return (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => setOpen(expanded ? null : key)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{item.name || item.slug}</span>
                  <span className="block text-[10px] text-slate-400">{item.category} · {inr(item.price)} · {item.sizes.length} sizes</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${total === 0 ? "bg-rose-50 text-rose-700" : total <= 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{total} units</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded ? (
                <div className="border-t border-slate-100 p-4">
                  <VariantStockEditor
                    stockKey={key}
                    sizes={item.sizes}
                    sizeOnly
                    label={`Stock by size — ${item.name}`}
                    onSaved={() => void load()}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
        {data.items.length === 0 ? <p className="rounded-2xl bg-white p-8 text-center text-xs text-slate-400">No products in this collection yet.</p> : null}
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><Package className="h-3 w-3" /> Changes here appear in Inventory Management under New Arrivals / Winterwear.</p>
    </div>
  );
}

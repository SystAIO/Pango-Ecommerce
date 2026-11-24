"use client";

/** Admin → Manage Inventory → Combo Inventory: per-combo colour/size stock. */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Package, RefreshCw } from "lucide-react";
import type { ComboData, ComboProduct } from "@/lib/combo-data";
import { DEFAULT_COMBO_DATA } from "@/lib/combo-data";
import { inr } from "@/lib/site";
import VariantStockEditor from "@/app/components/VariantStockEditor";

type Variant = { color: string; size: string; quantity: number };

export default function ComboInventory() {
  const [data, setData] = useState<ComboData>(DEFAULT_COMBO_DATA);
  const [stocks, setStocks] = useState<Record<number, Variant[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/combos", { credentials: "include" });
      const comboData: ComboData = res.ok ? await res.json() : DEFAULT_COMBO_DATA;
      setData(comboData);
      const entries = await Promise.all(
        comboData.combos.map(async (c) => {
          const r = await fetch(`/api/admin/variant-stock?key=${encodeURIComponent(`combo:${c.id}`)}`, { credentials: "include" });
          const d = await r.json();
          return [c.id, d.variants ?? []] as const;
        })
      );
      setStocks(Object.fromEntries(entries));
    } catch {
      setNotice("Could not load combo inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => {
    let units = 0;
    let combosWithStock = 0;
    data.combos.forEach((c) => {
      const rows = stocks[c.id] ?? [];
      const sum = rows.reduce((n, v) => n + Math.max(0, v.quantity), 0);
      units += sum;
      if (sum > 0) combosWithStock++;
    });
    return { units, combosWithStock };
  }, [data.combos, stocks]);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading combo inventory…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Combo Inventory</h2>
          <p className="mt-1 text-xs text-slate-500">
            Stock for every combo, by colour and size. Set quantities in Combo Products — they appear
            here and in Inventory Management automatically. Each combo has a stable unique ID.
          </p>
          {notice ? <p className="mt-1 text-[11px] font-semibold text-orange-600">{notice}</p> : null}
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Combos", value: data.combos.length, icon: Package },
          { label: "Combos with stock", value: totals.combosWithStock, icon: Package },
          { label: "Total units", value: totals.units, icon: Package },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</p><p className="mt-1 text-xl font-black text-slate-900">{s.value}</p></div>
              <span className="rounded-xl bg-orange-50 p-2 text-orange-600"><s.icon className="h-5 w-5" /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {data.combos.map((combo: ComboProduct) => {
          const rows = stocks[combo.id] ?? [];
          const total = rows.reduce((n, v) => n + Math.max(0, v.quantity), 0);
          const expanded = open === combo.id;
          return (
            <div key={combo.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => setOpen(expanded ? null : combo.id)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {combo.image ? <img src={combo.image} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{combo.name || combo.slug}</span>
                  <span className="block text-[10px] text-slate-400">ID #{combo.id} · {combo.category} · {inr(combo.price)}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${total === 0 ? "bg-rose-50 text-rose-700" : total <= 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {total} units
                </span>
              </button>
              {expanded ? (
                <div className="border-t border-slate-100 p-4">
                  <VariantStockEditor
                    stockKey={`combo:${combo.id}`}
                    colors={combo.colors}
                    sizes={combo.sizes}
                    label={`Stock for combo #${combo.id}`}
                    onSaved={() => void load()}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
        {data.combos.length === 0 ? <p className="rounded-2xl bg-white p-8 text-center text-xs text-slate-400">No combos yet — add them in Combo Products.</p> : null}
      </div>
    </div>
  );
}

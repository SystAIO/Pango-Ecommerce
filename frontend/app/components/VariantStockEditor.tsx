"use client";

/** Admin stock editor: quantity per colour and per size for one catalogue item. */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";

type Row = { color: string; size: string; quantity: number };

export default function VariantStockEditor({
  stockKey,
  colors = [],
  sizes = [],
  label,
  onSaved,
  sizeOnly = false,
}: {
  stockKey: string;
  colors?: string[];
  sizes?: string[];
  label?: string;
  onSaved?: () => void;
  /** Collections with no colour variants: manage stock per size only. */
  sizeOnly?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");

  useEffect(() => {
    if (!stockKey) return;
    setLoading(true);
    fetch(`/api/admin/variant-stock?key=${encodeURIComponent(stockKey)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { variants: [] }))
      .then((data: { variants?: Row[] }) => setRows(data.variants ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [stockKey]);

  const allColors = useMemo(
    () => [...new Set([...colors, ...rows.map((r) => r.color).filter(Boolean)])].filter(Boolean),
    [colors, rows]
  );
  const allSizes = useMemo(
    () => [...new Set([...sizes, ...rows.map((r) => r.size).filter(Boolean)])].filter(Boolean),
    [sizes, rows]
  );

  const quantityFor = (color: string, size: string) =>
    rows.find((r) => r.color === color && r.size === size)?.quantity ?? 0;

  const setQuantity = (color: string, size: string, quantity: number) => {
    setRows((prev) => {
      const exists = prev.some((r) => r.color === color && r.size === size);
      if (exists) {
        return prev.map((r) => (r.color === color && r.size === size ? { ...r, quantity: Math.max(0, quantity) } : r));
      }
      return [...prev, { color, size, quantity: Math.max(0, quantity) }];
    });
  };

  const save = async () => {
    setSaving(true);
    setNotice("");
    setNoticeError(false);
    try {
      const res = await fetch("/api/admin/variant-stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: stockKey, variants: rows.filter((r) => r.color || r.size) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save stock");
      setRows(data.variants ?? rows);
      setNotice("Stock saved — Inventory Management will show it.");
      onSaved?.();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save stock");
      setNoticeError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!stockKey) return <p className="text-[11px] text-slate-400">Save the item first to set stock.</p>;
  if (loading) return <p className="text-[11px] text-slate-400"><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />Loading stock…</p>;

  const total = rows.reduce((n, r) => n + Math.max(0, r.quantity || 0), 0);

  // Size-only mode: one quantity per size, no colour grid or colour inputs.
  if (sizeOnly) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{label ?? "Stock by size"}</p>
            <p className="text-[10px] text-slate-400">Total units: {total}</p>
          </div>
          <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-orange-700 disabled:opacity-50">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save stock
          </button>
        </div>

        {allSizes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-[11px] text-slate-400">Add a size below, then set its quantity.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allSizes.map((size) => {
              const row = rows.find((r) => r.color === "" && r.size === size);
              return (
                <label key={size} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-bold text-slate-700">{size}</span>
                  <input
                    type="number"
                    min={0}
                    value={row?.quantity ?? 0}
                    onChange={(e) => setQuantity("", size, Number(e.target.value))}
                    className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs"
                  />
                </label>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Add size" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px]" />
          <button type="button" onClick={() => { if (newSize.trim()) { setRows((p) => [...p, { color: "", size: newSize.trim(), quantity: 0 }]); setNewSize(""); } }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-600"><Plus className="h-3 w-3" /> Size</button>
        </div>
        {notice ? <p className="text-[10px] font-semibold text-emerald-600">{notice}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
            {label ?? "Stock by colour & size"}
          </p>
          <p className="text-[10px] text-slate-400">Total units: {total}</p>
        </div>
        <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save stock
        </button>
      </div>

      {allColors.length === 0 || allSizes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-[11px] text-slate-400">
          Add at least one colour and one size below, then set quantities.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Colour / Size</th>
                {allSizes.map((s) => <th key={s} className="px-2 py-2 text-center">{s}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allColors.map((color) => (
                <tr key={color}>
                  <td className="px-3 py-2 font-bold text-slate-700">{color}</td>
                  {allSizes.map((size) => (
                    <td key={size} className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        value={quantityFor(color, size)}
                        onChange={(e) => setQuantity(color, size, Number(e.target.value))}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-[11px]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Add colour" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px]" />
        <button type="button" onClick={() => { if (newColor.trim()) { setRows((p) => [...p, { color: newColor.trim(), size: "", quantity: 0 }]); setNewColor(""); } }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-600"><Plus className="h-3 w-3" /> Colour</button>
        <input value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Add size" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px]" />
        <button type="button" onClick={() => { if (newSize.trim()) { setRows((p) => [...p, { color: "", size: newSize.trim(), quantity: 0 }]); setNewSize(""); } }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-600"><Plus className="h-3 w-3" /> Size</button>
      </div>

      {notice ? <p className={`text-[10px] font-semibold ${noticeError ? "text-rose-600" : "text-emerald-600"}`}>{notice}</p> : null}
    </div>
  );
}

"use client";

/** Admin → Customize Filters: catalogue filter groups, sort options, collection copy and FAQs. */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_CATALOG_CONFIG,
  type CatalogConfig,
  type CatalogFaq,
  type FilterGroup,
} from "@/lib/catalog-config";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase transition-colors ${
        checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      <span className={`relative h-3.5 w-6 rounded-full ${checked ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white ${checked ? "left-3" : "left-0.5"}`} />
      </span>
      {checked ? "On" : "Off"}
    </button>
  );
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export default function CatalogEditor() {
  const [config, setConfig] = useState<CatalogConfig>(clone(DEFAULT_CATALOG_CONFIG));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const ref = useRef(config);
  ref.current = config;

  useEffect(() => {
    fetch("/api/catalog-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CatalogConfig | null) => data && setConfig(data))
      .catch(() => setNotice("Could not load config — showing defaults."))
      .finally(() => setLoading(false));
  }, []);

  const patch = useCallback((next: CatalogConfig) => {
    setConfig(next);
    setNotice("Saving…");
  }, []);

  useEffect(() => {
    if (notice !== "Saving…") return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch("/api/catalog-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(ref.current),
        });
        if (!res.ok) throw new Error("save failed");
        setNotice("Saved — the product page updates on refresh.");
      } catch {
        setNotice("Could not save — check the backend and try again.");
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [notice, config]);

  if (loading) {
    return <div className="rounded-2xl bg-white p-6 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading catalogue settings…</div>;
  }

  const updateGroup = (index: number, value: Partial<FilterGroup>) =>
    patch({ ...config, groups: config.groups.map((g, i) => (i === index ? { ...g, ...value } : g)) });

  const moveGroup = (index: number, direction: -1 | 1) => {
    const groups = [...config.groups];
    const to = index + direction;
    if (to < 0 || to >= groups.length) return;
    [groups[index], groups[to]] = [groups[to], groups[index]];
    patch({ ...config, groups });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Customize Filters</h2>
        <p className="mt-1 text-xs text-slate-500">
          Control every filter group on the product page. Change labels, reorder them, switch them
          off, or edit the values shown. Empty “values” are derived automatically from your products.
          Changes save on their own.
        </p>
        <p className={`mt-2 text-[11px] font-semibold ${notice.startsWith("Could not") ? "text-rose-600" : "text-emerald-600"}`}>
          {saving ? "Saving…" : notice}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {config.groups.map((group, index) => (
          <section key={group.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveGroup(index, -1)} disabled={index === 0} aria-label="Move up" className="rounded-lg border p-1.5 disabled:opacity-30">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => moveGroup(index, 1)} disabled={index === config.groups.length - 1} aria-label="Move down" className="rounded-lg border p-1.5 disabled:opacity-30">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <span className="text-sm font-black text-slate-900">{group.label}</span>
              </div>
              <Toggle checked={group.enabled} onChange={(v) => updateGroup(index, { enabled: v })} />
            </div>
            <div className="mt-3 space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-500">
                Filter label
                <input
                  value={group.label}
                  onChange={(e) => updateGroup(index, { label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                />
              </label>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Values (comma separated)</span>
                <textarea
                  rows={2}
                  value={group.options.join(", ")}
                  onChange={(e) =>
                    updateGroup(index, {
                      options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Blank = derive from products"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900">Sort options</h3>
        <textarea
          rows={2}
          value={config.sortOptions.join(", ")}
          onChange={(e) =>
            patch({
              ...config,
              sortOptions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900">Size guide</h3>
        <p className="mt-1 text-[11px] text-slate-500">
          Shown in the “Size guide” popup on every product page. Add or remove rows freely.
        </p>
        <div className="mt-3 space-y-2">
          {config.sizeGuide.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              {(["size", "chest", "length", "shoulder", "sleeve", "waist"] as const).map((field) => (
                <label key={field} className="text-[9px] font-bold uppercase text-slate-500">
                  {field}
                  <input
                    value={row[field]}
                    onChange={(e) =>
                      patch({
                        ...config,
                        sizeGuide: config.sizeGuide.map((r, i) =>
                          i === index ? { ...r, [field]: e.target.value } : r
                        ),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  />
                </label>
              ))}
              <button
                type="button"
                onClick={() => patch({ ...config, sizeGuide: config.sizeGuide.filter((_, i) => i !== index) })}
                className="mb-0.5 rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                aria-label="Remove size row"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch({ ...config, sizeGuide: [...config.sizeGuide, { size: "", chest: "", waist: "", length: "", shoulder: "", sleeve: "" }] })
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"
          >
            <Plus className="h-4 w-4" /> Add size
          </button>
          <label className="block text-[10px] font-bold uppercase text-slate-500">
            “How to measure” text
            <textarea
              rows={3}
              value={config.sizeGuideHowTo}
              onChange={(e) => patch({ ...config, sizeGuideHowTo: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900">Coupons</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Applied instantly on the product page when the order value meets the minimum.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              patch({
                ...config,
                coupons: [...config.coupons, { code: "", label: "", description: "", minOrder: 0, value: 0, kind: "flat", active: true }],
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"
          >
            <Plus className="h-4 w-4" /> Add coupon
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {config.coupons.map((coupon, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex justify-end">
                <Toggle
                  checked={coupon.active}
                  onChange={(v) =>
                    patch({ ...config, coupons: config.coupons.map((c, i) => (i === index ? { ...c, active: v } : c)) })
                  }
                />
                <button
                  type="button"
                  onClick={() => patch({ ...config, coupons: config.coupons.filter((_, i) => i !== index) })}
                  className="ml-2 rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                  aria-label="Remove coupon"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  ["code", "Code"],
                  ["label", "Title"],
                  ["description", "Description"],
                ] as const).map(([field, label]) => (
                  <label key={field} className="text-[10px] font-bold uppercase text-slate-500">
                    {label}
                    <input
                      value={coupon[field] as string}
                      onChange={(e) =>
                        patch({
                          ...config,
                          coupons: config.coupons.map((c, i) => (i === index ? { ...c, [field]: e.target.value } : c)),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case"
                    />
                  </label>
                ))}
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Type
                  <select
                    value={coupon.kind}
                    onChange={(e) =>
                      patch({
                        ...config,
                        coupons: config.coupons.map((c, i) => (i === index ? { ...c, kind: e.target.value as "flat" | "percent" } : c)),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="flat">Flat ₹ off</option>
                    <option value="percent">Percent off</option>
                  </select>
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  {coupon.kind === "flat" ? "Discount (₹)" : "Discount (%)"}
                  <input
                    type="number"
                    min={0}
                    value={coupon.value}
                    onChange={(e) =>
                      patch({
                        ...config,
                        coupons: config.coupons.map((c, i) => (i === index ? { ...c, value: Number(e.target.value) } : c)),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Min order (₹)
                  <input
                    type="number"
                    min={0}
                    value={coupon.minOrder}
                    onChange={(e) =>
                      patch({
                        ...config,
                        coupons: config.coupons.map((c, i) => (i === index ? { ...c, minOrder: Number(e.target.value) } : c)),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </label>
              </div>
            </div>
          ))}
          {config.coupons.length === 0 ? (
            <p className="text-[11px] text-slate-400">No coupons yet — add one to show an Apply button on products.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900">Collection copy &amp; FAQ</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-bold uppercase text-slate-500">
            Heading
            <input
              value={config.collection.heading}
              onChange={(e) => patch({ ...config, collection: { ...config.collection, heading: e.target.value } })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
            />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">
            FAQ heading
            <input
              value={config.collection.faqHeading}
              onChange={(e) => patch({ ...config, collection: { ...config.collection, faqHeading: e.target.value } })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
            />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">
            Description
            <textarea
              rows={4}
              value={config.collection.description}
              onChange={(e) => patch({ ...config, collection: { ...config.collection, description: e.target.value } })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
            />
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {config.collection.faqs.map((faq, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    patch({ ...config, collection: { ...config.collection, faqs: config.collection.faqs.filter((_, i) => i !== index) } })
                  }
                  className="text-rose-500"
                  aria-label="Remove FAQ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                value={faq.q}
                placeholder="Question"
                onChange={(e) =>
                  patch({
                    ...config,
                    collection: {
                      ...config.collection,
                      faqs: config.collection.faqs.map((f, i) => (i === index ? { ...f, q: e.target.value } : f)),
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
              <textarea
                rows={2}
                value={faq.a}
                placeholder="Answer"
                onChange={(e) =>
                  patch({
                    ...config,
                    collection: {
                      ...config.collection,
                      faqs: config.collection.faqs.map((f, i) => (i === index ? { ...f, a: e.target.value } : f)),
                    },
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch({
                ...config,
                collection: {
                  ...config.collection,
                  faqs: [...config.collection.faqs, { q: "", a: "" } as CatalogFaq],
                },
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"
          >
            <Plus className="h-4 w-4" /> Add FAQ
          </button>
        </div>
      </section>
    </div>
  );
}

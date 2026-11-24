"use client";

/** Admin → Manage New Arrivals / Manage Winterwear. */

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Image as ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";
import {
  DEFAULT_COLLECTIONS,
  type CollectionData,
  type CollectionItem,
  type CollectionKey,
  type CollectionSpecSection,
} from "@/lib/collection-data";
import VariantStockEditor from "@/app/components/VariantStockEditor";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const csv = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

const COLOR_HEX: Record<string, string> = {
  black: "#111111", blue: "#2563eb", brown: "#7c3f22", green: "#22a06b",
  grey: "#9ca3af", gray: "#9ca3af", maroon: "#7f1d1d", white: "#ffffff",
  navy: "#1e3a8a", red: "#dc2626", yellow: "#eab308", beige: "#d6c3a5",
};
const SUGGESTED_COLORS = ["Black", "Blue", "Brown", "Green", "Grey", "Maroon", "White"];
const SUGGESTED_SIZES = ["S", "M", "L", "XL", "XXL"];

function ImageInput({ label, value, onChange, multiple = false }: { label: string; value: string; onChange: (v: string) => void; multiple?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const urls = csv(value);
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) continue;
        const form = new FormData();
        form.append("file", file);
        form.append("folder", "collections");
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (res.ok && data.url) added.push(data.url);
      }
      onChange(multiple ? [...urls, ...added].join(", ") : added[0] ?? value);
    } catch { /* ignore */ } finally { setUploading(false); }
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:border-orange-400">
          <input type="file" accept="image/*" multiple={multiple} onChange={upload} disabled={uploading} className="hidden" />
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? "Uploading…" : "Upload"}
        </label>
      </div>
      <textarea rows={multiple ? 2 : 1} value={value} onChange={(e) => onChange(e.target.value)} placeholder={multiple ? "Paste image URLs, comma separated" : "Paste an image URL"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-500" />
      {urls.length > 0 ? <div className="flex flex-wrap gap-2">{urls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={u} alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
      ))}</div> : null}
    </div>
  );
}

function ChipPicker({ label, values, suggestions, onChange, colors = false }: { label: string; values: string[]; suggestions: string[]; onChange: (v: string[]) => void; colors?: boolean }) {
  const [draft, setDraft] = useState("");
  const add = (value: string) => {
    const t = value.trim();
    if (!t || values.some((v) => v.toLowerCase() === t.toLowerCase())) return;
    onChange([...values, t]);
    setDraft("");
  };
  return (
    <div className="sm:col-span-3">
      <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
        {values.map((v) => <span key={v} className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
          {colors ? <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: COLOR_HEX[v.toLowerCase()] ?? "#d6d3d1" }} /> : null}
          {v}<button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-slate-400 hover:text-rose-500" aria-label={`Remove ${v}`}>✕</button>
        </span>)}
        {values.length === 0 ? <span className="text-[11px] text-slate-400">None yet — add below.</span> : null}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } }} placeholder="Add and press Enter…" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-500" />
        <button type="button" onClick={() => add(draft)} className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600">Add</button>
      </div>
      {suggestions.length > 0 ? <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase())).map((s) => (
          <button key={s} type="button" onClick={() => add(s)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-orange-400 hover:text-orange-600">
            {colors ? <span className="h-2.5 w-2.5 rounded-full border border-slate-300" style={{ backgroundColor: COLOR_HEX[s.toLowerCase()] ?? "#d6d3d1" }} /> : null}+ {s}
          </button>
        ))}
      </div> : null}
    </div>
  );
}

function SpecBuilder({ sections, onChange }: { sections: CollectionSpecSection[]; onChange: (s: CollectionSpecSection[]) => void }) {
  const update = (i: number, v: Partial<CollectionSpecSection>) => onChange(sections.map((s, idx) => (idx === i ? { ...s, ...v } : s)));
  return (
    <div className="sm:col-span-3 space-y-3">
      {sections.map((section, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input value={section.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Section title" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold" />
            <button type="button" onClick={() => update(i, { items: [...section.items, { key: "", value: "" }] })} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] font-bold text-orange-700">+ Add Box</button>
            <button type="button" onClick={() => onChange(sections.filter((_, idx) => idx !== i))} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600">× Delete Section</button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {section.items.map((item, j) => (
              <div key={j} className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="flex justify-end"><button type="button" onClick={() => update(i, { items: section.items.filter((_, idx) => idx !== j) })} className="text-slate-400 hover:text-rose-500" aria-label="Remove box">✕</button></div>
                <input value={item.key} placeholder="Attribute" onChange={(e) => update(i, { items: section.items.map((it, idx) => (idx === j ? { ...it, key: e.target.value } : it)) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold" />
                <input value={item.value} placeholder="Value" onChange={(e) => update(i, { items: section.items.map((it, idx) => (idx === j ? { ...it, value: e.target.value } : it)) })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px]" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...sections, { title: `SECTION ${sections.length + 1}`, items: [] }])} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:border-orange-400 hover:text-orange-600"><Plus className="h-4 w-4" /> Add section</button>
    </div>
  );
}

export default function CollectionEditor({ collectionKey, label }: { collectionKey: CollectionKey; label: string }) {
  const [data, setData] = useState<CollectionData>(clone(DEFAULT_COLLECTIONS[collectionKey]));
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef(data);
  ref.current = data;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/collections/${collectionKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CollectionData | null) => d && setData(d))
      .catch(() => setNotice("Could not load — showing defaults."))
      .finally(() => setLoading(false));
  }, [collectionKey]);

  const patch = useCallback((next: CollectionData) => { setData(next); setNotice("Saving…"); }, []);

  useEffect(() => {
    if (notice !== "Saving…") return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/collections/${collectionKey}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(ref.current),
        });
        if (!res.ok) throw new Error("save failed");
        setNotice("Saved — pages update on refresh.");
      } catch { setNotice("Could not save — check the backend and try again."); }
      finally { setSaving(false); }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [notice, data, collectionKey]);

  if (loading) return <div className="rounded-2xl bg-white p-6 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading {label}…</div>;

  const updateItem = (slug: string, value: Partial<CollectionItem>) =>
    patch({ ...data, items: data.items.map((i) => (i.slug === slug ? { ...i, ...value } : i)) });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Manage {label}</h2>
            <p className="mt-1 text-xs text-slate-500">Products, images, colours, sizes, details, coupon and page copy for the {label} pages. Changes save on their own.</p>
            <p className={`mt-2 text-[11px] font-semibold ${notice.startsWith("Could not") ? "text-rose-600" : "text-emerald-600"}`}>{saving ? "Saving…" : notice}</p>
          </div>
          <a href={`/${collectionKey}`} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">View page ↗</a>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black">Coupon</h3>
        <p className="mt-1 text-[11px] text-slate-500">Instant Apply button on every product in this collection.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {([["code", "Code"], ["label", "Title"], ["description", "Description"]] as const).map(([field, lbl]) => (
            <label key={field} className="text-[10px] font-bold uppercase text-slate-500">{lbl}
              <input value={String(data.coupon[field])} onChange={(e) => patch({ ...data, coupon: { ...data.coupon, [field]: e.target.value } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case" />
            </label>
          ))}
          <label className="text-[10px] font-bold uppercase text-slate-500">Type
            <select value={data.coupon.kind} onChange={(e) => patch({ ...data, coupon: { ...data.coupon, kind: e.target.value as "flat" | "percent" } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs">
              <option value="flat">Flat ₹ off</option><option value="percent">Percent off</option>
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">{data.coupon.kind === "flat" ? "Discount (₹)" : "Discount (%)"}
            <input type="number" min={0} value={data.coupon.value} onChange={(e) => patch({ ...data, coupon: { ...data.coupon, value: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Min order (₹)
            <input type="number" min={0} value={data.coupon.minOrder} onChange={(e) => patch({ ...data, coupon: { ...data.coupon, minOrder: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-700">
          <input type="checkbox" checked={data.coupon.active} onChange={(e) => patch({ ...data, coupon: { ...data.coupon, active: e.target.checked } })} className="h-4 w-4 accent-orange-600" /> Coupon active
        </label>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black">Products ({data.items.length})</h3>
          <button type="button" onClick={() => {
            const slug = `item-${Date.now()}`;
            patch({ ...data, items: [...data.items, { slug, name: "", brand: "Pango", category: "General", badge: "", price: 0, mrp: 0, image: "", images: [], description: "", colors: [], sizes: [], specs: {}, insights: [], active: true }] });
            setOpen(slug);
          }} className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"><Plus className="h-4 w-4" /> Add product</button>
        </div>

        {data.items.map((item, index) => {
          const expanded = open === item.slug;
          return (
            <div key={item.slug} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => setOpen(expanded ? null : item.slug)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="m-3 h-6 w-6 text-slate-300" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.name || "Untitled product"}</span><span className="block truncate text-[10px] text-slate-400">{item.slug}</span></span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.active ? "Live" : "Off"}</span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded ? (
                <div className="border-t border-slate-100 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {([["name", "Name"], ["slug", "Slug"], ["brand", "Brand"], ["category", "Category"], ["badge", "Badge"]] as const).map(([f, lbl]) => (
                      <label key={f} className="text-[10px] font-bold uppercase text-slate-500">{lbl}
                        <input value={String(item[f])} onChange={(e) => updateItem(item.slug, { [f]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case" />
                      </label>
                    ))}
                    <label className="text-[10px] font-bold uppercase text-slate-500">Price (₹)<input type="number" min={0} value={item.price} onChange={(e) => updateItem(item.slug, { price: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                    <label className="text-[10px] font-bold uppercase text-slate-500">MRP (₹)<input type="number" min={0} value={item.mrp} onChange={(e) => updateItem(item.slug, { mrp: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                    <label className="flex items-center gap-2 pt-6 text-xs font-bold"><input type="checkbox" checked={item.active} onChange={(e) => updateItem(item.slug, { active: e.target.checked })} className="h-4 w-4 accent-orange-600" /> Active</label>
                    <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-3">Description<textarea rows={3} value={item.description} onChange={(e) => updateItem(item.slug, { description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                    <div className="sm:col-span-3"><ImageInput label="Main image (URL or upload)" value={item.image} onChange={(v) => updateItem(item.slug, { image: v })} /></div>
                    <div className="sm:col-span-3"><ImageInput label="Gallery images (URLs or upload)" value={item.images.join(", ")} multiple onChange={(v) => updateItem(item.slug, { images: csv(v) })} /></div>
                    <ChipPicker label="Sizes" values={item.sizes} suggestions={SUGGESTED_SIZES} onChange={(sizes) => updateItem(item.slug, { sizes })} />
                    <div className="sm:col-span-3">
                      <VariantStockEditor
                        stockKey={`collection:${collectionKey}:${item.slug}`}
                        sizes={item.sizes}
                        sizeOnly
                        label="Stock by size"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Product details</span>
                      <div className="mt-2">
                        <SpecBuilder
                          sections={item.specSections?.length ? item.specSections : [{ title: "PRODUCT DETAILS", items: Object.entries(item.specs).map(([key, value]) => ({ key, value })) }]}
                          onChange={(specSections) => {
                            const specs: Record<string, string> = {};
                            specSections.forEach((s) => s.items.forEach((i) => { if (i.key) specs[i.key] = i.value; }));
                            updateItem(item.slug, { specSections, specs });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Product insights (this product only)</p>
                    <div className="mt-2 space-y-3">
                      {item.insights.map((insight, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex justify-end"><button type="button" onClick={() => updateItem(item.slug, { insights: item.insights.filter((_, j) => j !== i) })} className="text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button></div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Title<input value={insight.title} onChange={(e) => updateItem(item.slug, { insights: item.insights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                            <label className="text-[10px] font-bold uppercase text-slate-500">Caption<input value={insight.caption} onChange={(e) => updateItem(item.slug, { insights: item.insights.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                            <div className="sm:col-span-2"><ImageInput label="Insight image" value={insight.image} onChange={(v) => updateItem(item.slug, { insights: item.insights.map((x, j) => (j === i ? { ...x, image: v } : x)) })} /></div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => updateItem(item.slug, { insights: [...item.insights, { title: "", caption: "", image: "" }] })} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"><Plus className="h-4 w-4" /> Add insight</button>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => patch({ ...data, items: data.items.filter((_, i) => i !== index) })} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Delete product</button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h3 className="text-base font-black">Product Insights (shared)</h3><p className="mt-1 text-[11px] text-slate-500">Shown on products without their own insights. URL or upload.</p></div>
          <button type="button" onClick={() => patch({ ...data, insights: [...data.insights, { title: "", caption: "", image: "" }] })} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"><Plus className="h-4 w-4" /> Add insight</button>
        </div>
        <div className="mt-4 space-y-3">
          {data.insights.map((insight, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex justify-end"><button type="button" onClick={() => patch({ ...data, insights: data.insights.filter((_, j) => j !== i) })} className="text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button></div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase text-slate-500">Title<input value={insight.title} onChange={(e) => patch({ ...data, insights: data.insights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                <label className="text-[10px] font-bold uppercase text-slate-500">Caption<input value={insight.caption} onChange={(e) => patch({ ...data, insights: data.insights.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                <div className="sm:col-span-2"><ImageInput label="Insight image" value={insight.image} onChange={(v) => patch({ ...data, insights: data.insights.map((x, j) => (j === i ? { ...x, image: v } : x)) })} /></div>
              </div>
            </div>
          ))}
          {data.insights.length === 0 ? <p className="text-[11px] text-slate-400">No shared insights yet.</p> : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black">Page copy &amp; FAQ</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-bold uppercase text-slate-500">Heading<input value={data.collection.heading} onChange={(e) => patch({ ...data, collection: { ...data.collection, heading: e.target.value } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
          <label className="text-[10px] font-bold uppercase text-slate-500">FAQ heading<input value={data.collection.faqHeading} onChange={(e) => patch({ ...data, collection: { ...data.collection, faqHeading: e.target.value } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
          <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">Description<textarea rows={4} value={data.collection.description} onChange={(e) => patch({ ...data, collection: { ...data.collection, description: e.target.value } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
        </div>
        <div className="mt-4 space-y-3">
          {data.collection.faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex justify-end"><button type="button" onClick={() => patch({ ...data, collection: { ...data.collection, faqs: data.collection.faqs.filter((_, j) => j !== i) } })} className="text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button></div>
              <input value={faq.q} placeholder="Question" onChange={(e) => patch({ ...data, collection: { ...data.collection, faqs: data.collection.faqs.map((f, j) => (j === i ? { ...f, q: e.target.value } : f)) } })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
              <textarea rows={2} value={faq.a} placeholder="Answer" onChange={(e) => patch({ ...data, collection: { ...data.collection, faqs: data.collection.faqs.map((f, j) => (j === i ? { ...f, a: e.target.value } : f)) } })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
            </div>
          ))}
          <button type="button" onClick={() => patch({ ...data, collection: { ...data.collection, faqs: [...data.collection.faqs, { q: "", a: "" }] } })} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"><Plus className="h-4 w-4" /> Add FAQ</button>
        </div>
      </section>
    </div>
  );
}

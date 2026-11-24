"use client";

/** Admin → Combo Products: manage the combo catalogue, its coupon, copy and FAQ. */

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Image as ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { DEFAULT_COMBO_DATA, comboId, type ComboData, type ComboProduct, type ComboSpecSection } from "@/lib/combo-data";
import VariantStockEditor from "@/app/components/VariantStockEditor";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const csv = (value: string) => value.split(",").map((s) => s.trim()).filter(Boolean);

const COLOR_HEX: Record<string, string> = {
  black: "#111111", blue: "#2563eb", brown: "#7c3f22", green: "#22a06b",
  grey: "#9ca3af", gray: "#9ca3af", maroon: "#7f1d1d", white: "#ffffff",
  navy: "#1e3a8a", red: "#dc2626", yellow: "#eab308", beige: "#d6c3a5",
  olive: "#6b7a3a", teal: "#0d9488", pink: "#ec4899",
};

/** Chip picker with common suggestions — much quicker than typing CSV. */
function ChipPicker({
  label, values, suggestions, onChange, colors = false,
}: {
  label: string;
  values: string[];
  suggestions: string[];
  onChange: (values: string[]) => void;
  colors?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...values, trimmed]);
    setDraft("");
  };
  const remove = (value: string) => onChange(values.filter((v) => v !== value));

  return (
    <div className="sm:col-span-3">
      <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
        {values.map((value) => (
          <span key={value} className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
            {colors ? <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: COLOR_HEX[value.toLowerCase()] ?? "#d6d3d1" }} /> : null}
            {value}
            <button type="button" onClick={() => remove(value)} className="text-slate-400 hover:text-rose-500" aria-label={`Remove ${value}`}>✕</button>
          </span>
        ))}
        {values.length === 0 ? <span className="text-[11px] text-slate-400">None yet — add below or tap a suggestion.</span> : null}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } }}
          placeholder={`Add a ${colors ? "colour" : "size"} and press Enter…`}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-500"
        />
        <button type="button" onClick={() => add(draft)} className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600">Add</button>
      </div>
      {suggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase())).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => add(suggestion)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-orange-400 hover:text-orange-600"
            >
              {colors ? <span className="h-2.5 w-2.5 rounded-full border border-slate-300" style={{ backgroundColor: COLOR_HEX[suggestion.toLowerCase()] ?? "#d6d3d1" }} /> : null}
              + {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Section + key/value box builder, like Product Management's spec builder. */
function SpecSectionBuilder({
  sections, onChange,
}: {
  sections: ComboSpecSection[];
  onChange: (sections: ComboSpecSection[]) => void;
}) {
  const update = (index: number, value: Partial<ComboSpecSection>) =>
    onChange(sections.map((s, i) => (i === index ? { ...s, ...value } : s)));

  return (
    <div className="sm:col-span-3 space-y-3">
      {sections.map((section, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              value={section.title}
              onChange={(e) => update(index, { title: e.target.value })}
              placeholder="Section title"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
            />
            <button type="button" onClick={() => update(index, { items: [...section.items, { key: "", value: "" }] })} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] font-bold text-orange-700">+ Add Box</button>
            <button type="button" onClick={() => onChange(sections.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600">× Delete Section</button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="flex justify-end">
                  <button type="button" onClick={() => update(index, { items: section.items.filter((_, i) => i !== itemIndex) })} className="text-slate-400 hover:text-rose-500" aria-label="Remove box">✕</button>
                </div>
                <input value={item.key} placeholder="Attribute (e.g. Fabric)" onChange={(e) => update(index, { items: section.items.map((it, i) => (i === itemIndex ? { ...it, key: e.target.value } : it)) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold" />
                <input value={item.value} placeholder="Value (e.g. 100% cotton)" onChange={(e) => update(index, { items: section.items.map((it, i) => (i === itemIndex ? { ...it, value: e.target.value } : it)) })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px]" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...sections, { title: `SECTION ${sections.length + 1}`, items: [] }])} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:border-orange-400 hover:text-orange-600">
        <Plus className="h-4 w-4" /> Add section
      </button>
    </div>
  );
}

const SUGGESTED_COLORS = ["Black", "Cedar Green", "Chocolate Brown", "Dark Grey", "Navy Blue", "Soft Grey", "True Blue", "White"];
const SUGGESTED_SIZES = ["S", "M", "L", "XL", "XXL", "3XL"];

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
        form.append("folder", "combos");
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
      <textarea
        rows={multiple ? 2 : 1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={multiple ? "Paste image URLs, comma separated" : "Paste an image URL"}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-500"
      />
      {urls.length > 0 ? <div className="flex flex-wrap gap-2">{urls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={u} alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
      ))}</div> : null}
    </div>
  );
}

export default function ComboEditor() {
  const [data, setData] = useState<ComboData>(clone(DEFAULT_COMBO_DATA));
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef(data);
  ref.current = data;

  useEffect(() => {
    fetch("/api/combos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ComboData | null) => d && setData(d))
      .catch(() => setNotice("Could not load combos — showing defaults."))
      .finally(() => setLoading(false));
  }, []);

  const patch = useCallback((next: ComboData) => { setData(next); setNotice("Saving…"); }, []);

  useEffect(() => {
    if (notice !== "Saving…") return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch("/api/combos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(ref.current),
        });
        if (!res.ok) throw new Error("save failed");
        setNotice("Saved — combo pages update on refresh.");
      } catch { setNotice("Could not save — check the backend and try again."); }
      finally { setSaving(false); }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [notice, data]);

  if (loading) return <div className="rounded-2xl bg-white p-6 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading combos…</div>;

  const updateCombo = (slug: string, value: Partial<ComboProduct>) =>
    patch({ ...data, combos: data.combos.map((c) => (c.slug === slug ? { ...c, ...value } : c)) });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Combo Products</h2>
            <p className="mt-1 text-xs text-slate-500">
              Manage combo products for /combo-page and their detail pages. Each combo has its own
              images, colours, sizes, coupon and product details. Changes save on their own.
            </p>
            <p className={`mt-2 text-[11px] font-semibold ${notice.startsWith("Could not") ? "text-rose-600" : "text-emerald-600"}`}>
              {saving ? "Saving…" : notice}
            </p>
          </div>
          <a href="/combo-page" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">View combo page ↗</a>
        </div>
      </div>

      {/* Coupon */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900">Combo coupon</h3>
        <p className="mt-1 text-[11px] text-slate-500">Shown on every combo detail page with an instant Apply button.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {([
            ["code", "Code"],
            ["label", "Title"],
            ["description", "Description"],
          ] as const).map(([field, label]) => (
            <label key={field} className="text-[10px] font-bold uppercase text-slate-500">
              {label}
              <input
                value={String(data.coupon[field])}
                onChange={(e) => patch({ ...data, coupon: { ...data.coupon, [field]: e.target.value } })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case"
              />
            </label>
          ))}
          <label className="text-[10px] font-bold uppercase text-slate-500">
            Type
            <select
              value={data.coupon.kind}
              onChange={(e) => patch({ ...data, coupon: { ...data.coupon, kind: e.target.value as "flat" | "percent" } })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            >
              <option value="flat">Flat ₹ off</option><option value="percent">Percent off</option>
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">
            {data.coupon.kind === "flat" ? "Discount (₹)" : "Discount (%)"}
            <input type="number" min={0} value={data.coupon.value} onChange={(e) => patch({ ...data, coupon: { ...data.coupon, value: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">
            Min order (₹)
            <input type="number" min={0} value={data.coupon.minOrder} onChange={(e) => patch({ ...data, coupon: { ...data.coupon, minOrder: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-700">
          <input type="checkbox" checked={data.coupon.active} onChange={(e) => patch({ ...data, coupon: { ...data.coupon, active: e.target.checked } })} className="h-4 w-4 accent-orange-600" />
          Coupon active
        </label>
      </section>

      {/* Combos list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Combos ({data.combos.length})</h3>
          <button
            type="button"
            onClick={() => {
              const slug = `combo-${Date.now()}`;
              patch({
                ...data,
                combos: [...data.combos, {
                  id: comboId(slug), slug, name: "", brand: "Pango", category: "T-Shirts", badge: "COMBO", price: 0, mrp: 0,
                  image: "", images: [], description: "", colors: [], sizes: [], specs: {}, insights: [], active: true,
                }],
              });
              setOpen(slug);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" /> Add combo
          </button>
        </div>

        {data.combos.map((combo, index) => {
          const expanded = open === combo.slug;
          return (
            <div key={combo.slug} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => setOpen(expanded ? null : combo.slug)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {combo.image ? <img src={combo.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="m-3 h-6 w-6 text-slate-300" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{combo.name || "Untitled combo"}</span>
                  <span className="block truncate text-[10px] text-slate-400">{combo.slug}</span>
                </span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${combo.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{combo.active ? "Live" : "Off"}</span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded ? (
                <div className="border-t border-slate-100 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {([
                      ["name", "Name"],
                      ["slug", "Slug"],
                      ["brand", "Brand"],
                      ["category", "Category"],
                      ["badge", "Badge (e.g. PICK ANY 2)"],
                    ] as const).map(([field, label]) => (
                      <label key={field} className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-1">
                        {label}
                        <input value={String(combo[field])} onChange={(e) => updateCombo(combo.slug, { [field]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case" />
                      </label>
                    ))}
                    <label className="text-[10px] font-bold uppercase text-slate-500">
                      Price (₹)
                      <input type="number" min={0} value={combo.price} onChange={(e) => updateCombo(combo.slug, { price: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                    </label>
                    <label className="text-[10px] font-bold uppercase text-slate-500">
                      MRP (₹)
                      <input type="number" min={0} value={combo.mrp} onChange={(e) => updateCombo(combo.slug, { mrp: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                    </label>
                    <label className="flex items-center gap-2 pt-6 text-xs font-bold text-slate-700">
                      <input type="checkbox" checked={combo.active} onChange={(e) => updateCombo(combo.slug, { active: e.target.checked })} className="h-4 w-4 accent-orange-600" /> Active
                    </label>
                    <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-3">
                      Description
                      <textarea rows={3} value={combo.description} onChange={(e) => updateCombo(combo.slug, { description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case" />
                    </label>
                    <div className="sm:col-span-3"><ImageInput label="Main image (URL or upload)" value={combo.image} onChange={(v) => updateCombo(combo.slug, { image: v })} /></div>
                    <div className="sm:col-span-3"><ImageInput label="Gallery images (URLs or upload)" value={combo.images.join(", ")} multiple onChange={(v) => updateCombo(combo.slug, { images: csv(v) })} /></div>
                    <ChipPicker
                      label="Colors for Color 1 & Color 2"
                      values={combo.colors}
                      suggestions={SUGGESTED_COLORS}
                      colors
                      onChange={(colors) => updateCombo(combo.slug, { colors })}
                    />
                    <ChipPicker
                      label="Sizes for Size 1 & Size 2"
                      values={combo.sizes}
                      suggestions={SUGGESTED_SIZES}
                      onChange={(sizes) => updateCombo(combo.slug, { sizes })}
                    />
                    <div className="sm:col-span-3">
                      <VariantStockEditor
                        stockKey={`combo:${combo.id}`}
                        colors={combo.colors}
                        sizes={combo.sizes}
                        label="Stock by colour & size"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Product details</span>
                      <p className="mt-0.5 text-[10px] text-slate-400">Editable sections and attribute boxes — shown under Product Details on the combo page.</p>
                      <div className="mt-2">
                        <SpecSectionBuilder
                          sections={combo.specSections?.length ? combo.specSections : [{ title: "PRODUCT DETAILS", items: Object.entries(combo.specs).map(([key, value]) => ({ key, value })) }]}
                          onChange={(specSections) => {
                            const specs: Record<string, string> = {};
                            specSections.forEach((s) => s.items.forEach((i) => { if (i.key) specs[i.key] = i.value; }));
                            updateCombo(combo.slug, { specSections, specs });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Product insights (optional)</p>
                    <div className="mt-2 space-y-3">
                      {combo.insights.map((insight, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex justify-end"><button type="button" onClick={() => updateCombo(combo.slug, { insights: combo.insights.filter((_, j) => j !== i) })} className="text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button></div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Title<input value={insight.title} onChange={(e) => updateCombo(combo.slug, { insights: combo.insights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                            <label className="text-[10px] font-bold uppercase text-slate-500">Caption<input value={insight.caption} onChange={(e) => updateCombo(combo.slug, { insights: combo.insights.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></label>
                            <div className="sm:col-span-2"><ImageInput label="Insight image" value={insight.image} onChange={(v) => updateCombo(combo.slug, { insights: combo.insights.map((x, j) => (j === i ? { ...x, image: v } : x)) })} /></div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => updateCombo(combo.slug, { insights: [...combo.insights, { title: "", caption: "", image: "" }] })} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"><Plus className="h-4 w-4" /> Add insight</button>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => patch({ ...data, combos: data.combos.filter((_, i) => i !== index) })} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Delete combo</button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      {/* Shared product insights */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900">Product Insights (shared)</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              These photos appear under every combo detail page that has no insights of its own.
              Paste a URL or upload straight to Cloudinary.
            </p>
          </div>
          <button
            type="button"
            onClick={() => patch({ ...data, insights: [...data.insights, { title: "", caption: "", image: "" }] })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:border-orange-400 hover:text-orange-600"
          >
            <Plus className="h-4 w-4" /> Add insight
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {data.insights.map((insight, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => patch({ ...data, insights: data.insights.filter((_, j) => j !== i) })} className="text-rose-500" aria-label="Remove insight"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase text-slate-500">Title
                  <input value={insight.title} onChange={(e) => patch({ ...data, insights: data.insights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">Caption
                  <input value={insight.caption} onChange={(e) => patch({ ...data, insights: data.insights.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                </label>
                <div className="sm:col-span-2">
                  <ImageInput label="Insight image" value={insight.image} onChange={(v) => patch({ ...data, insights: data.insights.map((x, j) => (j === i ? { ...x, image: v } : x)) })} />
                </div>
              </div>
            </div>
          ))}
          {data.insights.length === 0 ? <p className="text-[11px] text-slate-400">No shared insights yet.</p> : null}
        </div>
      </section>

      {/* Collection copy & FAQ */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900">Combo page copy &amp; FAQ</h3>
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

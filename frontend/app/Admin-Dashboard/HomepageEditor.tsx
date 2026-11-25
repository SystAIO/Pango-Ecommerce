"use client";

/**
 * Admin → Customize Homepage.
 *
 * One card per homepage section: an on/off switch plus that section's copy,
 * links and images. Saving PUTs the whole payload to `/api/homepage-sections`
 * (admin-only), which merges each provided section over the built-in defaults
 * and upserts it — so an old row missing a new field still saves cleanly.
 *
 * Rail sections (Combos / New Launch / Feels Good) show their existing cards
 * as editable cards — populated from the live catalogue on first edit — and
 * New Arrivals exposes its category chips as an add/remove list. The winter
 * banner still uses `SlugPicker` for its product links.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DEFAULT_SECTIONS,
  csvList,
  type HomeCard,
  type HomeSectionKey,
  type HomeSections,
} from "@/lib/homepage-content";
import type { Product } from "@/lib/product-shape";
import { inr } from "@/lib/site";

/* ═════════════════════════════ small building blocks ═════════════════════════════ */

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-600">
      {children}
      {hint ? <span className="ml-1.5 font-medium normal-case tracking-normal text-slate-400">{hint}</span> : null}
    </span>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <Label hint={hint}>{label}</Label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-orange-500"
      />
    </label>
  );
}

function TextAreaField({
  label,
  hint,
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <Label hint={hint}>{label}</Label>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-orange-500"
      />
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`relative h-3.5 w-6 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${checked ? "left-3" : "left-0.5"}`}
        />
      </span>
      {checked ? "On" : "Off"}
      <span className="sr-only">{label}</span>
    </button>
  );
}

/** One editable homepage block: heading, on/off switch, body. */
function SectionCard({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-3xl border bg-white p-5 shadow-sm transition-opacity sm:p-6 ${
        enabled ? "border-slate-200" : "border-slate-200 opacity-60"
      }`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{description}</p>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label={`Toggle ${title}`} />
      </header>
      <div className={enabled ? "" : "pointer-events-none select-none"} aria-hidden={!enabled}>
        {children}
      </div>
    </section>
  );
}

/**
 * Image field: a pasteable URL and a Cloudinary upload button, both visible at
 * once. Uploads go through /api/upload and fill the same URL field.
 */
function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10MB limit.");
      return;
    }
    try {
      setUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "homepage");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… paste an image URL"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500"
        />
        <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-orange-400 hover:bg-orange-50">
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-orange-600" aria-hidden />
          ) : (
            <Upload className="h-4 w-4 text-orange-500" aria-hidden />
          )}
          {uploading ? "Uploading…" : "Upload"}
        </label>
      </div>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">{value}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            title="Remove image"
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : hint ? (
        <p className="text-[10px] text-slate-400">{hint}</p>
      ) : null}

      {error ? <p className="text-[11px] font-bold text-rose-500">{error}</p> : null}
    </div>
  );
}

/** Checkbox picker for product slugs — value is a comma-separated string. */
function SlugPicker({
  value,
  onChange,
  products,
  multiple = true,
  hint,
}: {
  value: string;
  onChange: (csv: string) => void;
  products: Product[];
  multiple?: boolean;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(csvList(value)), [value]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
        )
      : products;
    return list.slice(0, 60);
  }, [products, query]);

  const toggle = (slug: string) => {
    if (!multiple) {
      onChange(selected.has(slug) ? "" : slug);
      setOpen(false);
      return;
    }
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange([...next].join(","));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label hint={hint}>Products</Label>
        <div className="flex items-center gap-2">
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10.5px] font-semibold text-slate-400 underline hover:text-rose-500"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[10.5px] font-bold text-slate-600 hover:bg-slate-50"
          >
            {value ? `${selected.size} selected` : "Choose"}
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      {value ? (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2">
          {[...selected].map((slug) => (
            <span
              key={slug}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 ring-1 ring-slate-200"
            >
              <span className="truncate">{slug}</span>
              <button
                type="button"
                onClick={() => toggle(slug)}
                className="text-slate-400 hover:text-rose-500"
                aria-label={`Remove ${slug}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
          Empty — the homepage picks the best sellers automatically.
        </p>
      )}

      {open ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-transparent text-xs text-slate-700 outline-none"
            />
          </div>
          <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto bg-white">
            {visible.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400">No products match.</p>
            ) : (
              visible.map((product) => {
                const active = selected.has(product.slug);
                return (
                  <button
                    key={product.slug}
                    type="button"
                    onClick={() => toggle(product.slug)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-orange-50/60"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        active ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {active ? <Check className="h-3 w-3" aria-hidden /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-700">
                        {product.name}
                      </span>
                      <span className="block truncate text-[10px] text-slate-400">{product.slug}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type HomeProducts = {
  deals?: Product[];
  bestSellers?: Product[];
  newArrivals?: Product[];
  products?: Product[];
  categories?: { category: string; count: number }[];
  byCategory?: { category: string; products: Product[] }[];
};

/** Turns a catalogue product into an editable card, mirroring what the storefront shows. */
function cardFromProduct(product: Product): HomeCard {
  const bits = [product.price > 0 ? inr(product.price) : "On request"];
  if (product.mrp > product.price) bits.push(inr(product.mrp));
  if (product.discount) bits.push(`(${product.discount}% OFF)`);
  return {
    image: product.image_url ?? "",
    title: product.badge || product.category || "",
    description: product.name,
    priceLabel: bits.join("  "),
    href: `/product/${product.slug}`,
  };
}

const uniqueProducts = (products: Product[], limit: number): Product[] => {
  const seen = new Set<string>();
  return products.filter((p) => !seen.has(p.slug) && Boolean(seen.add(p.slug))).slice(0, limit);
};

/** Editable category chips. Shows the live list until the admin makes it their own. */
function ChipEditor({
  value,
  source,
  onChange,
}: {
  value: string;
  source: string[];
  onChange: (csv: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const saved = csvList(value);
  const automatic = saved.length === 0;
  const chips = automatic ? source : saved;

  const commit = (list: string[]) =>
    onChange([...new Set(list.map((s) => s.trim()).filter(Boolean))].join(", "));
  const add = () => {
    if (!draft.trim()) return;
    commit([...chips, draft]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label hint="add, remove and reorder the filter chips">Category chips</Label>
        {automatic ? (
          <button
            type="button"
            onClick={() => commit(source)}
            className="text-[10.5px] font-semibold text-orange-600 underline hover:text-orange-700"
          >
            Make these editable
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10.5px] font-semibold text-slate-400 underline hover:text-rose-500"
          >
            Use automatic
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2">
        {chips.map((chip, index) => (
          <span
            key={`${chip}-${index}`}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
          >
            <span className="truncate">{chip}</span>
            <button
              type="button"
              onClick={() => commit(chips.filter((_, i) => i !== index))}
              className="text-slate-400 hover:text-rose-500"
              aria-label={`Remove ${chip}`}
            >
              ✕
            </button>
          </span>
        ))}
        {chips.length === 0 ? (
          <span className="text-[11px] text-slate-400">No categories yet — add one below.</span>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a category, then press Enter…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-orange-500"
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600"
        >
          Add
        </button>
      </div>

      {automatic ? (
        <p className="text-[10px] text-slate-400">
          Showing the live catalogue categories. Press “Make these editable” to freeze them into
          your own list — or just add one to start a custom list.
        </p>
      ) : null}
    </div>
  );
}

/** Editable list of fully authored cards (image + copy + price + link). */
function CardsEditor({
  cards,
  onChange,
}: {
  cards: HomeCard[];
  onChange: (cards: HomeCard[]) => void;
}) {
  const update = (index: number, field: keyof HomeCard, value: string) =>
    onChange(cards.map((card, i) => (i === index ? { ...card, [field]: value } : card)));

  return (
    <div className="space-y-3">
      {cards.map((card, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10.5px] font-black uppercase tracking-wide text-slate-500">
              Card {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (index === 0) return;
                  const next = [...cards];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
                disabled={index === 0}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-30"
                aria-label={`Move card ${index + 1} left`}
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (index === cards.length - 1) return;
                  const next = [...cards];
                  [next[index], next[index + 1]] = [next[index + 1], next[index]];
                  onChange(next);
                }}
                disabled={index === cards.length - 1}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-30"
                aria-label={`Move card ${index + 1} right`}
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onChange(cards.filter((_, i) => i !== index))}
                className="rounded-lg px-2 py-1.5 text-rose-500 hover:bg-rose-50"
                aria-label={`Remove card ${index + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <ImageField label="Card image" value={card.image} onChange={(v) => update(index, "image", v)} />
            <TextField
              label="Label on image"
              value={card.title}
              onChange={(v) => update(index, "title", v)}
              placeholder="Suede Regular Fit"
            />
            <TextField
              label="Description"
              value={card.description}
              onChange={(v) => update(index, "description", v)}
              placeholder="Bottle Green Suede Regular Fit Jacket"
            />
            <TextField
              label="Price"
              value={card.priceLabel}
              onChange={(v) => update(index, "priceLabel", v)}
              placeholder="₹1599  ₹3999 (60% OFF)"
            />
            <TextField
              label="Link"
              value={card.href}
              onChange={(v) => update(index, "href", v)}
              placeholder="/product/your-product"
            />
          </div>
        </div>
      ))}

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
          Empty — this section fills itself from products in the catalogue. Add a card to take full control of the image and copy.
        </p>
      ) : null}

      {cards.length < 12 ? (
        <button
          type="button"
          onClick={() =>
            onChange([...cards, { image: "", title: "", description: "", priceLabel: "", href: "" }])
          }
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add card ({cards.length}/12)
        </button>
      ) : null}
    </div>
  );
}

/* ═════════════════════════════ the editor ═════════════════════════════ */

const SECTION_LABELS: Record<HomeSectionKey, string> = {
  announcement: "Announcement strip",
  hero: "Hero campaign",
  upiBanner: "UPI offer strip",
  combos: "COMBOS rail",
  newLaunch: "NEW LAUNCH rail",
  winterRollout: "Winter rollout banner",
  trustStrip: "Trust strip",
  feelsGood: "“Feels good” rail",
  quickShop: "Quick shop by categories",
  reviews: "Customer reviews",
  newArrivals: "New arrivals grid",
};

export default function HomepageEditor() {
  const [sections, setSections] = useState<HomeSections>(structuredClone(DEFAULT_SECTIONS));
  const [products, setProducts] = useState<Product[]>([]);
  const [home, setHome] = useState<HomeProducts | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/homepage-sections", { credentials: "include" });
      const data = (await res.json()) as HomeSections;
      if (!res.ok) throw new Error("load failed");
      setSections({ ...structuredClone(DEFAULT_SECTIONS), ...data });
      setDirty(false);
    } catch {
      setNotice({
        kind: "error",
        text: "Could not load the saved homepage — showing the built-in defaults.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    fetch("/api/products?limit=500")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products?: Product[] } | null) => setProducts(data?.products ?? []))
      .catch(() => setProducts([]));
    // The same groups the storefront uses, so the editor can show the *actual*
    // cards already on the homepage instead of an empty list.
    fetch("/api/home")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HomeProducts | null) => setHome(data))
      .catch(() => setHome(null));
  }, [load]);

  // Materialise the current catalogue-driven cards into editable cards once,
  // on first load. Nothing is saved until the admin presses Save changes.
  useEffect(() => {
    if (seeded || loading || !home || products.length === 0) return;
    setSeeded(true);
    setSections((prev) => {
      const next = structuredClone(prev);
      if (next.combos.cards.length === 0) {
        next.combos.cards = uniqueProducts(
          [...(home.deals ?? []), ...(home.bestSellers ?? []), ...(home.products ?? products)],
          10
        ).map(cardFromProduct);
      }
      if (next.newLaunch.cards.length === 0) {
        next.newLaunch.cards = uniqueProducts(home.newArrivals ?? products, 10).map(cardFromProduct);
      }
      if (next.feelsGood.cards.length === 0) {
        const group = (home.byCategory ?? []).find(
          (g) => g.category.toLowerCase() === next.feelsGood.category.toLowerCase()
        );
        next.feelsGood.cards = uniqueProducts(
          group?.products ?? home.bestSellers ?? products,
          8
        ).map(cardFromProduct);
      }
      return next;
    });
  }, [seeded, loading, home, products]);

  /** Patch one section's scalar fields. */
  const patch = useCallback(<K extends HomeSectionKey>(key: K, value: Partial<HomeSections[K]>) => {
    setSections((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
    setDirty(true);
  }, []);

  /** Move one block up/down in the storefront render order. */
  const moveSection = (key: HomeSectionKey, direction: -1 | 1) => {
    setSections((prev) => {
      const order = [...prev.order];
      const from = order.indexOf(key);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= order.length) return prev;
      [order[from], order[to]] = [order[to], order[from]];
      return { ...prev, order };
    });
    setDirty(true);
  };

  const save = async (payload: HomeSections = sections) => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setDirty(false);
      // Other open storefront tabs listen for this and refresh themselves.
      window.localStorage.setItem("homepage-updated", String(Date.now()));
      setNotice({
        kind: "ok",
        text: "Homepage saved. Open storefront tabs refresh automatically; refresh this tab too if you have it open.",
      });
    } catch (err) {
      setNotice({
        kind: "error",
        text:
          err instanceof Error
            ? err.message
            : "Could not save the homepage. Check the backend and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Every edit persists itself after a short pause: an on/off toggle, a
  // reorder, or a card change can never be left unsaved because Save was missed.
  useEffect(() => {
    if (!dirty || loading) return;
    const timer = window.setTimeout(() => void save(sectionsRef.current), 600);
    return () => window.clearTimeout(timer);
    // `save` is recreated on every render; re-arm only when content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, loading, sections]);

  const reset = () => {
    setSections(structuredClone(DEFAULT_SECTIONS));
    setDirty(true);
    setNotice({ kind: "ok", text: "Reset to the bundled defaults — press Save changes to apply." });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-8 text-xs font-semibold text-slate-500 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-orange-600" aria-hidden />
        Loading homepage sections…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customize Homepage</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Move blocks up or down, switch any of them on or off, and edit every card,
            image and link. Changes save automatically and storefront tabs refresh themselves.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset to defaults
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {notice ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {dirty ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Saving your changes… the storefront will update in a moment.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ── ORDER & VISIBILITY ── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <header className="mb-4">
            <h3 className="text-base font-black tracking-tight text-slate-900">
              Section order &amp; visibility
            </h3>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
              Move a block up or down to change where it appears on the storefront. Use the
              On/Off switch on each card below to hide a block entirely.
            </p>
          </header>
          <ol className="grid gap-2 sm:grid-cols-2">
            {sections.order.map((key, index) => (
              <li
                key={key}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
              >
                <span className="w-5 text-[11px] font-black text-slate-400">{index + 1}</span>
                <span
                  className={`min-w-0 flex-1 truncate text-xs font-bold ${
                    sections[key].enabled ? "text-slate-800" : "text-slate-400 line-through"
                  }`}
                >
                  {SECTION_LABELS[key]}
                </span>
                <button
                  type="button"
                  onClick={() => moveSection(key, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${SECTION_LABELS[key]} up`}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(key, 1)}
                  disabled={index === sections.order.length - 1}
                  aria-label={`Move ${SECTION_LABELS[key]} down`}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
        </section>

        {/* ── ANNOUNCEMENT ── */}
        <SectionCard
          title="Announcement strip"
          description="The black bar at the very top of the storefront, above the navbar logo."
          enabled={sections.announcement.enabled}
          onToggle={(v) => patch("announcement", { enabled: v })}
        >
          <TextAreaField
            label="Strip text"
            rows={2}
            value={sections.announcement.text}
            onChange={(v) => patch("announcement", { text: v })}
            placeholder="Free Shipping Sitewide on Every Order, Don't Miss Out!!"
          />
        </SectionCard>

        {/* ── HERO ── */}
        <SectionCard
          title="Hero campaign carousel"
          description="The editorial banner below the navbar. Up to four slides; the arrows and dots appear automatically when there is more than one."
          enabled={sections.hero.enabled}
          onToggle={(v) => patch("hero", { enabled: v })}
        >
          <div className="space-y-4">
            {sections.hero.slides.map((slide, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                    Slide {index + 1}
                  </span>
                  {sections.hero.slides.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        patch("hero", {
                          slides: sections.hero.slides.filter((_, i) => i !== index),
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Eyebrow"
                    value={slide.eyebrow}
                    onChange={(v) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, eyebrow: v } : s)),
                      })
                    }
                    placeholder="New Season"
                  />
                  <TextField
                    label="Title"
                    value={slide.title}
                    onChange={(v) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, title: v } : s)),
                      })
                    }
                    placeholder="The Shirt Playbook"
                  />
                  <TextField
                    label="Subtitle"
                    value={slide.subtitle}
                    onChange={(v) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, subtitle: v } : s)),
                      })
                    }
                  />
                  <TextField
                    label="Price hook"
                    hint="right side"
                    value={slide.priceLabel}
                    onChange={(v) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, priceLabel: v } : s)),
                      })
                    }
                    placeholder="Starting at just ₹799"
                  />
                  <TextField
                    label="Hashtag"
                    value={slide.hashtag}
                    onChange={(v) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, hashtag: v } : s)),
                      })
                    }
                    placeholder="#SEASONOFHERITAGE"
                  />
                  <TextField
                    label="Hashtag link"
                    value={slide.hashtagHref}
                    onChange={(v) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, hashtagHref: v } : s)),
                      })
                    }
                    placeholder="/product-page?category=Shirts"
                  />
                  <TextField
                    label="Button label"
                    value={slide.ctaLabel}
                    onChange={(v) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, ctaLabel: v } : s)),
                      })
                    }
                    placeholder="Explore Shirts"
                  />
                  <TextField
                    label="Button link"
                    value={slide.ctaHref}
                    onChange={(v) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, ctaHref: v } : s)),
                      })
                    }
                    placeholder="/product-page"
                  />
                </div>

                <div className="mt-3">
                  <ImageField
                    label="Campaign image"
                    hint="wide landscape photo"
                    value={slide.image}
                    onChange={(url) =>
                      patch("hero", {
                        slides: sections.hero.slides.map((s, i) => (i === index ? { ...s, image: url } : s)),
                      })
                    }
                  />
                </div>
              </div>
            ))}

            {sections.hero.slides.length < 4 ? (
              <button
                type="button"
                onClick={() =>
                  patch("hero", {
                    slides: [
                      ...sections.hero.slides,
                      {
                        ...structuredClone(DEFAULT_SECTIONS.hero.slides[0]),
                        title: "",
                        image: "",
                      },
                    ],
                  })
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-600"
              >
                <Plus className="h-4 w-4" aria-hidden /> Add slide ({sections.hero.slides.length}/4)
              </button>
            ) : null}
          </div>
        </SectionCard>

        {/* ── UPI STRIP ── */}
        <SectionCard
          title="UPI / prepaid offer strip"
          description="The yellow banner directly under the hero."
          enabled={sections.upiBanner.enabled}
          onToggle={(v) => patch("upiBanner", { enabled: v })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Headline"
              value={sections.upiBanner.title}
              onChange={(v) => patch("upiBanner", { title: v })}
            />
            <TextField
              label="Sub-line"
              value={sections.upiBanner.subtitle}
              onChange={(v) => patch("upiBanner", { subtitle: v })}
            />
          </div>
        </SectionCard>

        {/* ── TRUST STRIP ── */}
        <SectionCard
          title="Trust strip"
          description="Up to three reassurance items, separated by dividers."
          enabled={sections.trustStrip.enabled}
          onToggle={(v) => patch("trustStrip", { enabled: v })}
        >
          <TextAreaField
            label="Items"
            hint="comma separated, three shown"
            rows={2}
            value={sections.trustStrip.items}
            onChange={(v) => patch("trustStrip", { items: v })}
            placeholder="COD AVAILABLE,7 DAYS RETURN,50L+ HAPPY CUSTOMERS"
          />
        </SectionCard>

        {/* ── COMBOS RAIL ── */}
        <SectionCard
          title="COMBOS rail"
          description="This rail is connected to the Combo Products tab: its cards, images, prices and links come from there, and “View all” opens the combo listing page. Only the heading and copy are edited here."
          enabled={sections.combos.enabled}
          onToggle={(v) => patch("combos", { enabled: v })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Heading" value={sections.combos.title} onChange={(v) => patch("combos", { title: v })} />
            <TextField label="Badge" value={sections.combos.badge} onChange={(v) => patch("combos", { badge: v })} />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Sub-heading"
                rows={2}
                value={sections.combos.subtitle}
                onChange={(v) => patch("combos", { subtitle: v })}
              />
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            To change a combo image, price, colours or sizes, open the <b>Combo Products</b> tab.
            The navbar <b>COMBOS</b> link and this rail both lead to the same combo catalogue.
          </div>
        </SectionCard>

        {/* ── NEW LAUNCH RAIL ── */}
        <SectionCard
          title="NEW LAUNCH rail"
          description="This rail is connected to the Manage New Arrivals tab — its cards, images, prices and links come from there, and “View all” opens the same page as the navbar New Arrivals link. Only the heading and copy are edited here."
          enabled={sections.newLaunch.enabled}
          onToggle={(v) => patch("newLaunch", { enabled: v })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Heading"
              value={sections.newLaunch.title}
              onChange={(v) => patch("newLaunch", { title: v })}
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Sub-heading"
                rows={2}
                value={sections.newLaunch.subtitle}
                onChange={(v) => patch("newLaunch", { subtitle: v })}
              />
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            To change a product, image or price here, use the <b>Manage New Arrivals</b> tab.
          </div>
        </SectionCard>

        {/* ── WINTER ROLLOUT ── */}
        <SectionCard
          title="Winter rollout banner"
          description="The big feature banner with a floating card holding three product thumbnails."
          enabled={sections.winterRollout.enabled}
          onToggle={(v) => patch("winterRollout", { enabled: v })}
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Eyebrow"
                value={sections.winterRollout.eyebrow}
                onChange={(v) => patch("winterRollout", { eyebrow: v })}
              />
              <TextField
                label="Heading"
                value={sections.winterRollout.title}
                onChange={(v) => patch("winterRollout", { title: v })}
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Body"
                  rows={2}
                  value={sections.winterRollout.subtitle}
                  onChange={(v) => patch("winterRollout", { subtitle: v })}
                />
              </div>
              <TextField
                label="Button label"
                value={sections.winterRollout.ctaLabel}
                onChange={(v) => patch("winterRollout", { ctaLabel: v })}
              />
              <TextField
                label="Button link"
                value={sections.winterRollout.ctaHref}
                onChange={(v) => patch("winterRollout", { ctaHref: v })}
              />
            </div>

            <ImageField
              label="Background image"
              hint="dark landscape photo"
              value={sections.winterRollout.background}
              onChange={(url) => patch("winterRollout", { background: url })}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              {sections.winterRollout.cards.map((card, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="mb-2 text-[10.5px] font-black uppercase tracking-wide text-slate-500">
                    Card {index + 1}
                  </p>
                  <div className="space-y-3">
                    <ImageField
                      label="Photo"
                      value={card.image}
                      onChange={(url) =>
                        patch("winterRollout", {
                          cards: sections.winterRollout.cards.map((c, i) =>
                            i === index ? { ...c, image: url } : c
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Caption"
                      value={card.label}
                      onChange={(v) =>
                        patch("winterRollout", {
                          cards: sections.winterRollout.cards.map((c, i) =>
                            i === index ? { ...c, label: v } : c
                          ),
                        })
                      }
                    />
                    <SlugPicker
                      multiple={false}
                      hint="link"
                      products={products}
                      value={card.slug}
                      onChange={(slug) =>
                        patch("winterRollout", {
                          cards: sections.winterRollout.cards.map((c, i) =>
                            i === index ? { ...c, slug } : c
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── FEELS GOOD RAIL ── */}
        <SectionCard
          title="“Feels good” category rail"
          description="Rail after the trust strip. The category decides which products fill it when no products are pinned elsewhere."
          enabled={sections.feelsGood.enabled}
          onToggle={(v) => patch("feelsGood", { enabled: v })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Heading"
              value={sections.feelsGood.title}
              onChange={(v) => patch("feelsGood", { title: v })}
            />
            <label className="block space-y-1.5">
              <Label hint="pick an existing one or type your own">Category</Label>
              <input
                type="text"
                list="homepage-feelsgood-categories"
                value={sections.feelsGood.category}
                onChange={(e) => patch("feelsGood", { category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500"
              />
              <datalist id="homepage-feelsgood-categories">
                {(home?.categories ?? []).map((c) => (
                  <option key={c.category} value={c.category} />
                ))}
              </datalist>
            </label>
            <div className="sm:col-span-2">
              <TextAreaField
                label="Sub-heading"
                rows={2}
                value={sections.feelsGood.subtitle}
                onChange={(v) => patch("feelsGood", { subtitle: v })}
              />
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Label hint="full control — changes appear on Save changes">Cards in this rail</Label>
            <div className="mt-2">
              <CardsEditor
                cards={sections.feelsGood.cards}
                onChange={(cards) => patch("feelsGood", { cards })}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── QUICK SHOP ── */}
        <SectionCard
          title="Quick shop by categories"
          description="Rectangular category tiles. Each needs a label and an image; the link is matched to a category in the navbar menu automatically."
          enabled={sections.quickShop.enabled}
          onToggle={(v) => patch("quickShop", { enabled: v })}
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Heading"
                value={sections.quickShop.title}
                onChange={(v) => patch("quickShop", { title: v })}
              />
              <TextField
                label="Sub-heading"
                value={sections.quickShop.subtitle}
                onChange={(v) => patch("quickShop", { subtitle: v })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {sections.quickShop.items.map((item, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wide text-slate-500">
                      Tile {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        patch("quickShop", {
                          items: sections.quickShop.items.filter((_, i) => i !== index),
                        })
                      }
                      className="rounded-lg px-2 py-1 text-rose-500 hover:bg-rose-50"
                      aria-label={`Remove tile ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <TextField
                      label="Label"
                      value={item.label}
                      onChange={(v) =>
                        patch("quickShop", {
                          items: sections.quickShop.items.map((it, i) =>
                            i === index ? { ...it, label: v } : it
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Link"
                      value={item.href}
                      onChange={(v) =>
                        patch("quickShop", {
                          items: sections.quickShop.items.map((it, i) =>
                            i === index ? { ...it, href: v } : it
                          ),
                        })
                      }
                      placeholder="/new-arrivals (only if not a navbar category)"
                    />
                    <ImageField
                      label="Photo"
                      value={item.image}
                      onChange={(url) =>
                        patch("quickShop", {
                          items: sections.quickShop.items.map((it, i) =>
                            i === index ? { ...it, image: url } : it
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {sections.quickShop.items.length < 12 ? (
              <button
                type="button"
                onClick={() =>
                  patch("quickShop", {
                    items: [...sections.quickShop.items, { label: "", image: "", href: "" }],
                  })
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-600"
              >
                <Plus className="h-4 w-4" aria-hidden /> Add category tile
              </button>
            ) : null}
          </div>
        </SectionCard>

        {/* ── REVIEWS ── */}
        <SectionCard
          title="Customer reviews"
          description="Photo cards with quote, rating and verified-buyer name."
          enabled={sections.reviews.enabled}
          onToggle={(v) => patch("reviews", { enabled: v })}
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Heading"
                value={sections.reviews.title}
                onChange={(v) => patch("reviews", { title: v })}
              />
              <TextField
                label="Sub-heading"
                value={sections.reviews.subtitle}
                onChange={(v) => patch("reviews", { subtitle: v })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {sections.reviews.items.map((item, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wide text-slate-500">
                      Review {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        patch("reviews", {
                          items: sections.reviews.items.filter((_, i) => i !== index),
                        })
                      }
                      className="rounded-lg px-2 py-1 text-rose-500 hover:bg-rose-50"
                      aria-label={`Remove review ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField
                        label="Name"
                        value={item.name}
                        onChange={(v) =>
                          patch("reviews", {
                            items: sections.reviews.items.map((it, i) =>
                              i === index ? { ...it, name: v } : it
                            ),
                          })
                        }
                      />
                      <label className="block space-y-1.5">
                        <Label>Rating</Label>
                        <select
                          value={item.rating}
                          onChange={(e) =>
                            patch("reviews", {
                              items: sections.reviews.items.map((it, i) =>
                                i === index ? { ...it, rating: Number(e.target.value) } : it
                              ),
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500"
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} star{n > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <TextField
                      label="Product"
                      hint="optional"
                      value={item.product}
                      onChange={(v) =>
                        patch("reviews", {
                          items: sections.reviews.items.map((it, i) =>
                            i === index ? { ...it, product: v } : it
                          ),
                        })
                      }
                    />
                    <TextAreaField
                      label="Review"
                      rows={3}
                      value={item.text}
                      onChange={(v) =>
                        patch("reviews", {
                          items: sections.reviews.items.map((it, i) =>
                            i === index ? { ...it, text: v } : it
                          ),
                        })
                      }
                    />
                    <ImageField
                      label="Customer photo"
                      value={item.image}
                      onChange={(url) =>
                        patch("reviews", {
                          items: sections.reviews.items.map((it, i) =>
                            i === index ? { ...it, image: url } : it
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {sections.reviews.items.length < 8 ? (
              <button
                type="button"
                onClick={() =>
                  patch("reviews", {
                    items: [
                      ...sections.reviews.items,
                      { name: "", product: "", text: "", rating: 5, image: "" },
                    ],
                  })
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-600"
              >
                <Plus className="h-4 w-4" aria-hidden /> Add review
              </button>
            ) : null}
          </div>
        </SectionCard>

        {/* ── NEW ARRIVALS ── */}
        <SectionCard
          title="New Arrivals grid"
          description="The product grid at the bottom. Edit the heading and category chips, or author fixed cards with your own images, copy and prices."
          enabled={sections.newArrivals.enabled}
          onToggle={(v) => patch("newArrivals", { enabled: v })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Heading"
              value={sections.newArrivals.title}
              onChange={(v) => patch("newArrivals", { title: v })}
            />
            <TextField
              label="View-all link"
              value={sections.newArrivals.viewAllHref}
              onChange={(v) => patch("newArrivals", { viewAllHref: v })}
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Sub-heading"
                rows={2}
                value={sections.newArrivals.subtitle}
                onChange={(v) => patch("newArrivals", { subtitle: v })}
              />
            </div>
            <div className="sm:col-span-2">
              <ChipEditor
                value={sections.newArrivals.categories}
                source={(home?.categories ?? []).map((c) => c.category)}
                onChange={(csv) => patch("newArrivals", { categories: csv })}
              />
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Label hint="optional — add fixed cards to replace the live grid">Cards in this grid</Label>
            <div className="mt-2">
              <CardsEditor
                cards={sections.newArrivals.cards}
                onChange={(cards) => patch("newArrivals", { cards })}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <p className="text-[11px] text-slate-400">
        Content lives in the <code className="text-orange-600">homepage_sections</code> table — if
        saving fails, run <code className="text-orange-600">supabase/homepage.sql</code> once in
        the Supabase SQL Editor, then try again.
      </p>
    </div>
  );
}

"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import NewArrivalCard from "@/app/components/home/NewArrivalCard";
import type { Product } from "@/lib/product-shape";
import type { CatalogConfig, FilterGroup } from "@/lib/catalog-config";
import { DEFAULT_CATALOG_CONFIG } from "@/lib/catalog-config";

const PAGE_SIZE = 15;

/** Reads any key out of the nested specifications JSON the admin builds. */
function specValue(product: Product, key: string): string {
  const flat: Record<string, string> = {};
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "string") flat[k.toLowerCase().trim()] = v;
      else if (v && typeof v === "object") walk(v);
    }
  };
  walk(product.specifications);
  return flat[key.toLowerCase().trim()] ?? "";
}

function priceBucket(price: number): string {
  if (price < 500) return "Rs. 299 – Rs. 499";
  if (price < 800) return "Rs. 800 – Rs. 999";
  if (price < 1500) return "Rs. 1000 – Rs. 1499";
  return "Rs. 1500 & above";
}

/** Which products match a single option of a filter group. */
function matchesOption(product: Product, groupKey: string, option: string): boolean {
  switch (groupKey) {
    case "category":
      return product.category.toLowerCase() === option.toLowerCase();
    case "price":
      return priceBucket(product.price) === option;
    case "color":
    case "size":
    case "pattern":
    case "fabric":
    case "neck":
    case "sleeves":
    case "fit":
    case "occasion":
    case "combo": {
      const keys: Record<string, string> = {
        color: "color",
        size: "size",
        pattern: "pattern",
        fabric: "fabric",
        neck: "neck",
        sleeves: "sleeves",
        fit: "fit",
        occasion: "occasion",
        combo: "combos",
      };
      const raw = specValue(product, keys[groupKey] ?? groupKey).toLowerCase();
      return raw
        .split(/[,/|;]/)
        .map((s) => s.trim())
        .some((s) => s.includes(option.toLowerCase()) || option.toLowerCase().includes(s));
    }
    default:
      return true;
  }
}

function FilterGroupBlock({
  group,
  options,
  selected,
  counts,
  onToggle,
}: {
  group: FilterGroup;
  options: string[];
  selected: string[];
  counts: (key: string, option: string) => number;
  onToggle: (key: string, option: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-stone-200 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-[#171512]">{group.label}</span>
        <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="mt-3 max-h-60 space-y-3 overflow-y-auto pr-1">
          {options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onToggle(group.key, option)}
                className="h-4 w-4 shrink-0 rounded border-stone-300 accent-orange-600"
              />
              {group.key === "color" ? (
                <ColorDot option={option} />
              ) : null}
              <span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">{option}</span>
              <span className="text-[12px] text-stone-400">({counts(group.key, option)})</span>
            </label>
          ))}
          {options.length === 0 ? (
            <p className="text-[11px] text-stone-400">Nothing to show yet.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const COLOR_HEX: Record<string, string> = {
  black: "#111111", blue: "#2563eb", brown: "#7c3f22", green: "#22a06b",
  grey: "#9ca3af", gray: "#9ca3af", maroon: "#7f1d1d", white: "#ffffff",
  navy: "#1e3a8a", red: "#dc2626", yellow: "#eab308", beige: "#d6c3a5",
  olive: "#6b7a3a", teal: "#0d9488", pink: "#ec4899",
};

function ColorDot({ option }: { option: string }) {
  const hex = COLOR_HEX[option.toLowerCase()] ?? "#d6d3d1";
  return (
    <span
      className="h-5 w-5 shrink-0 rounded-full border border-stone-300"
      style={{ backgroundColor: hex }}
      aria-hidden
    />
  );
}

function CatalogueContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "";
  const brandParam = searchParams.get("brand") ?? "";
  const searchParam = searchParams.get("search") ?? "";
  const genderParam = searchParams.get("gender") ?? "";
  const isWomen = genderParam === "women";

  const [config, setConfig] = useState<CatalogConfig>(DEFAULT_CATALOG_CONFIG);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState("Recommended");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileFilters, setMobileFilters] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/catalog-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CatalogConfig | null) => data && setConfig(data))
      .catch(() => setConfig(DEFAULT_CATALOG_CONFIG));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "500" });
    if (categoryParam) params.set("category", categoryParam);
    if (brandParam) params.set("brand", brandParam);
    if (searchParam) params.set("search", searchParam);
    if (isWomen) params.set("gender", "women");
    setLoading(true);
    fetch(`/api/products?${params}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products?: Product[] }) => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryParam, brandParam, searchParam, isWomen]);

  const groups = useMemo(() => config.groups.filter((g) => g.enabled), [config.groups]);

  const optionsFor = useCallback(
    (group: FilterGroup): string[] => {
      if (group.options.length > 0) return group.options;
      const set = new Set<string>();
      for (const p of products) {
        if (group.key === "category") set.add(p.category);
        else if (group.key === "price") set.add(priceBucket(p.price));
        else {
          const keys: Record<string, string> = {
            color: "color", size: "size", pattern: "pattern", fabric: "fabric",
            neck: "neck", sleeves: "sleeves", fit: "fit", occasion: "occasion", combo: "combos",
          };
          const raw = specValue(p, keys[group.key] ?? group.key);
          raw.split(/[,/|;]/).forEach((v) => v.trim() && set.add(v.trim()));
        }
      }
      return [...set].sort((a, b) => a.localeCompare(b));
    },
    [products]
  );

  const counts = useCallback(
    (key: string, option: string) =>
      products.filter((p) => matchesOption(p, key, option)).length,
    [products]
  );

  const filtered = useMemo(() => {
    let list = [...products];
    for (const [key, values] of Object.entries(selected)) {
      if (values.length === 0) continue;
      list = list.filter((p) => values.some((value) => matchesOption(p, key, value)));
    }
    switch (sort) {
      case "Alphabetically, A-Z": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "Alphabetically, Z-A": list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "Price, low to high": list.sort((a, b) => a.price - b.price); break;
      case "Price, high to low": list.sort((a, b) => b.price - a.price); break;
      case "Date, old to new": list.reverse(); break;
      case "Date, new to old": break;
      default: break;
    }
    return list;
  }, [products, selected, sort]);

  useEffect(() => setVisible(PAGE_SIZE), [selected, sort, categoryParam, searchParam]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length)),
      { rootMargin: "500px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length]);

  const toggleOption = (key: string, option: string) =>
    setSelected((prev) => {
      const current = prev[key] ?? [];
      return {
        ...prev,
        [key]: current.includes(option) ? current.filter((o) => o !== option) : [...current, option],
      };
    });

  const activeCount = Object.values(selected).reduce((n, v) => n + v.length, 0);
  const clearAll = () => setSelected({});
  const heading = isWomen
    ? categoryParam
      ? `${categoryParam} for Women`
      : "Women's Collection"
    : categoryParam || searchParam || config.collection.heading || "All Products";

  const sidebar = (
    <div className="rounded-2xl border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters
        </span>
        <button
          type="button"
          onClick={clearAll}
          className="text-[11px] font-bold uppercase tracking-wide text-stone-400 hover:text-orange-600"
        >
          Clear all
        </button>
      </div>
      <div className="px-4 pb-2">
        {groups.map((group) => (
          <FilterGroupBlock
            key={group.key}
            group={group}
            options={optionsFor(group)}
            selected={selected[group.key] ?? []}
            counts={counts}
            onToggle={toggleOption}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#171512]">
      <Navbar />

      <main className="mx-auto max-w-[1680px] px-4 pb-16 pt-5 sm:px-6 lg:px-10">
        {/* Breadcrumbs */}
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/product-page" className="hover:text-orange-600">All Products</Link>
          {isWomen ? (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href="/product-page?gender=women" className="hover:text-orange-600">Women</Link>
            </>
          ) : null}
          {categoryParam ? (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-stone-800">{categoryParam}</span>
            </>
          ) : null}
        </nav>

        <div className="flex gap-6">
          {/* Sticky desktop sidebar */}
          <aside className="hidden w-[260px] shrink-0 lg:block">
            <div className="sticky top-32">{sidebar}</div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">
                  {heading} <span className="text-sm font-normal text-stone-500">({filtered.length} Products)</span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFilters(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount ? ` (${activeCount})` : ""}
                </button>
                <label className="flex items-center gap-2 text-xs text-stone-500">
                  Sort by:
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-[#171512] outline-none"
                  >
                    {config.sortOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-sm font-bold text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading products…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                  {filtered.slice(0, visible).map((product, index) => (
                    <NewArrivalCard key={`${product.id}-${index}`} product={product} priority={index < 4} />
                  ))}
                </div>
                <div ref={sentinel} className="flex h-16 items-center justify-center" aria-hidden>
                  {visible < filtered.length ? (
                    <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                      Loading more…
                    </span>
                  ) : filtered.length > 0 ? (
                    <span className="text-xs font-semibold text-stone-400">
                      You have seen all {filtered.length} products
                    </span>
                  ) : (
                    <span className="text-sm text-stone-500">No products match these filters.</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Collection copy + FAQ */}
        <section className="mt-16 border-t border-stone-200 pt-10">
          <h2 className="text-lg font-bold">{config.collection.heading}</h2>
          <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-stone-600">
            {config.collection.description}
          </p>
          <h3 className="mt-10 text-xl font-bold">{config.collection.faqHeading}</h3>
          <div className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200">
            {config.collection.faqs.map((faq, index) => (
              <Faq key={index} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>
      </main>

      {mobileFilters ? (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-black">Filters</span>
              <button type="button" onClick={() => setMobileFilters(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
            <button
              type="button"
              onClick={() => setMobileFilters(false)}
              className="mt-4 w-full rounded-xl bg-[#171512] py-3 text-sm font-bold text-white"
            >
              Show {filtered.length} products
            </button>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold"
        aria-expanded={open}
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-stone-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <p className="px-4 pb-4 text-[13px] leading-6 text-stone-600">{a}</p> : null}
    </div>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-stone-500">Loading catalogue…</div>}>
      <CatalogueContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Package } from "lucide-react";
import type { Product } from "@/lib/product-shape";
import { csvList, type HomeSections } from "@/lib/homepage-content";
import NewArrivalCard from "./NewArrivalCard";
import CustomCard from "./CustomCard";

const PAGE_SIZE = 12;

/**
 * The infinite "new arrivals" grid at the bottom of the homepage.
 *
 * Newest products first, loaded 12 at a time as the shopper reaches the bottom
 * (IntersectionObserver on a sentinel). The heading/copy comes from the
 * admin-editable `newArrivals` section, but the products always come from the
 * live catalogue — only the order and the category chips narrow what is shown.
 */
export default function InfiniteArrivals({
  categories,
  heading,
}: {
  categories: string[];
  heading: HomeSections["newArrivals"];
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // Admin overrides: a custom category list and/or a fixed set of authored
  // cards. When cards are supplied there is no infinite fetching to do.
  const customCategories = csvList(heading.categories);
  const customCards = heading.cards;
  const chips = ["All", ...(customCategories.length > 0 ? customCategories : categories)];

  const loadPage = useCallback(
    async (nextOffset: number, cat: string | null, reset: boolean) => {
      const id = ++requestId.current;
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(nextOffset) });
        if (cat) params.set("category", cat);
        const res = await fetch(`/api/products?${params}`);
        const data = (await res.json()) as { products?: Product[] };
        const batch = data.products ?? [];
        if (id !== requestId.current) return; // a newer request won — discard
        setProducts((prev) => (reset ? batch : [...prev, ...batch]));
        setOffset(nextOffset + batch.length);
        if (batch.length < PAGE_SIZE) setDone(true);
      } catch {
        /* leave whatever is on screen; sentinel will retry on next scroll */
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    []
  );

  // Reset whenever the category filter changes. Authored cards need no fetch.
  useEffect(() => {
    if (customCards.length > 0) return;
    setProducts([]);
    setOffset(0);
    setDone(false);
    void loadPage(0, category, true);
  }, [category, loadPage, customCards.length]);

  // Infinite scroll sentinel.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && !done) {
          void loadPage(offset, category, false);
        }
      },
      { rootMargin: "600px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [offset, loading, done, category, loadPage]);

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#171512] sm:text-3xl">
          {heading.title}
        </h2>
        {heading.subtitle ? (
          <p className="mt-1 text-xs font-medium text-stone-500">{heading.subtitle}</p>
        ) : null}
        {heading.viewAllHref ? (
          <a
            href={heading.viewAllHref}
            className="mt-2 inline-block text-[11px] font-bold uppercase tracking-wide text-stone-600 transition-colors hover:text-orange-600"
          >
            View all →
          </a>
        ) : null}
      </div>

      {/* Category filter chips */}
      <div className="scrollbar-hide -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {chips.map((chip) => {
          const value = chip === "All" ? null : chip;
          const active = category === value;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={active}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all ${
                active
                  ? "border-[#171512] bg-[#171512] text-white"
                  : "border-stone-300 bg-white text-stone-600 hover:border-stone-500"
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Four columns on desktop, matching the campaign grid in the reference. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
        {customCards.length > 0
          ? customCards.map((card, index) => (
              <div key={`custom-${index}`} className="animate-fade-up">
                <CustomCard card={card} />
              </div>
            ))
          : products.map((product, index) => (
              <div key={`${product.id || product.slug}-${index}`} className="animate-fade-up">
                <NewArrivalCard product={product} />
              </div>
            ))}
      </div>

      {customCards.length === 0 && done && products.length > 0 ? (
        <p className="mt-8 text-center text-xs font-semibold uppercase tracking-widest text-stone-400">
          You are all caught up — {products.length} products shown
        </p>
      ) : null}

      {customCards.length === 0 && done && products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center text-stone-400">
          <Package className="h-8 w-8" aria-hidden />
          <p className="text-sm font-semibold">Nothing in this category yet — try another chip.</p>
        </div>
      ) : null}

      {/* Sentinel: when it nears the viewport, fetch the next page. Authored
          cards are a fixed set, so there is nothing more to load. */}
      {customCards.length === 0 ? (
        <div ref={sentinel} className="flex h-16 items-center justify-center" aria-hidden>
          {loading ? (
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading more
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ComboCard from "@/app/components/home/ComboCard";
import { DEFAULT_COMBO_DATA, type ComboData, type ComboProduct } from "@/lib/combo-data";

const PAGE_SIZE = 12;

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold">
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-stone-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <p className="px-4 pb-4 text-[13px] leading-6 text-stone-600">{a}</p> : null}
    </div>
  );
}

export default function ComboListingPage() {
  const [data, setData] = useState<ComboData>(DEFAULT_COMBO_DATA);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState("Recommended");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/combos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ComboData | null) => d && setData(d))
      .catch(() => setData(DEFAULT_COMBO_DATA))
      .finally(() => setLoading(false));
  }, []);

  const combos = useMemo(() => data.combos.filter((c) => c.active), [data.combos]);
  const categories = useMemo(() => [...new Set(combos.map((c) => c.category))].sort(), [combos]);

  const groups = useMemo(
    () => [
      { key: "category", label: "Categories", options: categories },
      { key: "color", label: "Color", options: [...new Set(combos.flatMap((c) => c.colors))].sort() },
      { key: "size", label: "Size", options: [...new Set(combos.flatMap((c) => c.sizes))].sort() },
      {
        key: "price",
        label: "Price Range",
        options: ["Under ₹999", "₹999 – ₹1,499", "₹1,500 & above"],
      },
    ],
    [categories, combos]
  );

  const matches = useCallback((combo: ComboProduct, key: string, option: string): boolean => {
    if (key === "category") return combo.category === option;
    if (key === "color") return combo.colors.some((c) => c.toLowerCase() === option.toLowerCase());
    if (key === "size") return combo.sizes.some((s) => s.toLowerCase() === option.toLowerCase());
    if (key === "price") {
      if (option === "Under ₹999") return combo.price < 999;
      if (option === "₹999 – ₹1,499") return combo.price >= 999 && combo.price < 1500;
      return combo.price >= 1500;
    }
    return true;
  }, []);

  const filtered = useMemo(() => {
    let list = combos.filter((c) =>
      Object.entries(selected).every(([key, values]) => values.length === 0 || values.some((v) => matches(c, key, v)))
    );
    list = [...list];
    if (sort === "Price, low to high") list.sort((a, b) => a.price - b.price);
    if (sort === "Price, high to low") list.sort((a, b) => b.price - a.price);
    if (sort === "Alphabetically, A-Z") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Alphabetically, Z-A") list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [combos, selected, sort, matches]);

  useEffect(() => setVisible(PAGE_SIZE), [selected, sort, data]);

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

  const toggle = (key: string, option: string) =>
    setSelected((prev) => {
      const current = prev[key] ?? [];
      return { ...prev, [key]: current.includes(option) ? current.filter((o) => o !== option) : [...current, option] };
    });

  const activeCount = Object.values(selected).reduce((n, v) => n + v.length, 0);

  const sidebar = (
    <div className="rounded-2xl border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wide"><SlidersHorizontal className="h-4 w-4" /> Filters</span>
        <button type="button" onClick={() => setSelected({})} className="text-[11px] font-bold uppercase text-stone-400 hover:text-orange-600">Clear all</button>
      </div>
      <div className="px-4 pb-2">
        {groups.map((group) => {
          const open = openGroups[group.key] ?? true;
          return (
            <div key={group.key} className="border-b border-stone-200 py-3">
              <button type="button" onClick={() => setOpenGroups((g) => ({ ...g, [group.key]: !open }))} className="flex w-full items-center justify-between text-left">
                <span className="text-sm font-bold text-[#171512]">{group.label}</span>
                <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open ? (
                <div className="mt-3 max-h-60 space-y-3 overflow-y-auto pr-1">
                  {group.options.map((option) => (
                    <label key={option} className="flex cursor-pointer items-center gap-3">
                      <input type="checkbox" checked={(selected[group.key] ?? []).includes(option)} onChange={() => toggle(group.key, option)} className="h-4 w-4 accent-orange-600" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">{option}</span>
                      <span className="text-[12px] text-stone-400">({combos.filter((c) => matches(c, group.key, option)).length})</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#171512]">
      <Navbar />
      <main className="mx-auto max-w-[1680px] px-4 pb-16 pt-5 sm:px-6 lg:px-10">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-stone-800">Combos</span>
        </nav>

        <div className="flex gap-6">
          <aside className="hidden w-[260px] shrink-0 lg:block"><div className="sticky top-32">{sidebar}</div></aside>
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h1 className="text-xl font-bold sm:text-2xl">Combo Products <span className="text-sm font-normal text-stone-500">({filtered.length})</span></h1>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMobileFilters(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount ? ` (${activeCount})` : ""}
                </button>
                <label className="flex items-center gap-2 text-xs text-stone-500">
                  Sort by:
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-[#171512] outline-none">
                    {["Recommended", "Alphabetically, A-Z", "Alphabetically, Z-A", "Price, low to high", "Price, high to low"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-sm font-bold text-stone-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading combos…</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                  {filtered.slice(0, visible).map((combo, i) => <ComboCard key={combo.slug} combo={combo} priority={i < 4} />)}
                </div>
                <div ref={sentinel} className="flex h-16 items-center justify-center" aria-hidden>
                  {visible < filtered.length ? <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Loading more…</span>
                    : filtered.length > 0 ? <span className="text-xs font-semibold text-stone-400">You have seen all {filtered.length} combos</span>
                    : <span className="text-sm text-stone-500">No combos match these filters.</span>}
                </div>
              </>
            )}
          </div>
        </div>

        <section className="mt-16 border-t border-stone-200 pt-10">
          <h2 className="text-lg font-bold">{data.collection.heading}</h2>
          <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-stone-600">{data.collection.description}</p>
          <h3 className="mt-10 text-xl font-bold">{data.collection.faqHeading}</h3>
          <div className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200">
            {data.collection.faqs.map((f, i) => <Faq key={i} q={f.q} a={f.a} />)}
          </div>
        </section>
      </main>

      {mobileFilters ? (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-white p-4">
            <div className="mb-3 flex items-center justify-between"><span className="font-black">Filters</span><button type="button" onClick={() => setMobileFilters(false)} aria-label="Close filters"><X className="h-5 w-5" /></button></div>
            {sidebar}
            <button type="button" onClick={() => setMobileFilters(false)} className="mt-4 w-full rounded-xl bg-[#171512] py-3 text-sm font-bold text-white">Show {filtered.length} combos</button>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}

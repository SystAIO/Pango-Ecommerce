"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComboProduct } from "@/lib/combo-data";
import SectionHeading from "./SectionHeading";
import ComboCard from "./ComboCard";

/** Horizontal rail of combo products, fed by Admin → Combo Products. */
export default function ComboRail({
  title,
  subtitle,
  badge,
  combos,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  combos: ComboProduct[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, combos.length]);

  if (combos.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: el.clientWidth * 0.8 * dir, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8" aria-label={title}>
      <SectionHeading title={title} subtitle={subtitle} href="/combo-page" badge={badge} />
      <div className="relative">
        <div ref={scroller} className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0">
          {combos.map((combo, i) => (
            <div key={combo.slug} className="w-[160px] shrink-0 snap-start xs:w-[178px] sm:w-[220px] lg:w-[244px]">
              <ComboCard combo={combo} priority={i < 4} />
            </div>
          ))}
        </div>
        {!atStart ? (
          <div className="pointer-events-none absolute inset-y-0 -left-1 hidden items-center sm:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label="Scroll combos left" className="pointer-events-auto flex h-9 w-9 translate-x-[-50%] items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-md">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        {!atEnd ? (
          <div className="pointer-events-none absolute inset-y-0 -right-1 hidden items-center sm:flex">
            <button type="button" onClick={() => scroll(1)} aria-label="Scroll combos right" className="pointer-events-auto flex h-9 w-9 translate-x-[50%] items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-md">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

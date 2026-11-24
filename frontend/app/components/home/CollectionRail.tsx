"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CollectionItem, CollectionKey } from "@/lib/collection-data";
import SectionHeading from "./SectionHeading";
import CollectionCard from "@/app/components/collection/CollectionCard";

/** Horizontal rail driven by an admin-managed collection. */
export default function CollectionRail({
  title,
  subtitle,
  badge,
  items,
  collectionKey,
  label,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  items: CollectionItem[];
  collectionKey: CollectionKey;
  label: string;
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
  }, [measure, items.length]);

  if (items.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: el.clientWidth * 0.8 * dir, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8" aria-label={title}>
      <SectionHeading title={title} subtitle={subtitle} href={`/${collectionKey}`} badge={badge} />
      <div className="relative">
        <div ref={scroller} className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0">
          {items.map((item, i) => (
            <div key={item.slug} className="w-[160px] shrink-0 snap-start xs:w-[178px] sm:w-[220px] lg:w-[244px]">
              <CollectionCard item={item} base={collectionKey} priority={i < 4} />
            </div>
          ))}
        </div>
        {/* Arrows exist only when there is somewhere to scroll: add more
            products in Admin and the right arrow appears; scroll to the end
            and it disappears. */}
        {!atStart ? (
          <div className="pointer-events-none absolute inset-y-0 -left-1 hidden items-center sm:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`} className="pointer-events-auto flex h-9 w-9 translate-x-[-50%] items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-md transition-opacity hover:bg-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        {!atEnd ? (
          <div className="pointer-events-none absolute inset-y-0 -right-1 hidden items-center sm:flex">
            <button type="button" onClick={() => scroll(1)} aria-label={`Scroll ${label} right`} className="pointer-events-auto flex h-9 w-9 translate-x-[50%] items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-md transition-opacity hover:bg-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

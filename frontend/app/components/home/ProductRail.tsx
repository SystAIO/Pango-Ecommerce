"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/product-shape";
import type { HomeCard } from "@/lib/homepage-content";
import SectionHeading from "./SectionHeading";
import RailCard from "./RailCard";
import CustomCard from "./CustomCard";

/**
 * A horizontally scrolling product rail.
 *
 * Centred heading (matching the campaign layout), snap scrolling with arrow
 * controls on desktop — a phone scrolls by swiping. Cards are `RailCard`s, so
 * the rails read as merchandise rather than as product cards with buttons.
 */
export default function ProductRail({
  title,
  subtitle,
  href,
  badge,
  products,
  /** Admin-authored cards; when present they replace catalogue products. */
  cards,
  /** Renders the category/badge as a dark label over each image. */
  overlay = false,
  cardClassName,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  badge?: string;
  products: Product[];
  cards?: HomeCard[];
  overlay?: boolean;
  cardClassName?: string;
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
  }, [measure, products.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.8 * direction, behavior: "smooth" });
  };

  if (products.length === 0 && (!cards || cards.length === 0)) return null;

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8" aria-label={title}>
      <SectionHeading title={title} subtitle={subtitle} href={href} badge={badge} />

      <div className="relative">
        <div
          ref={scroller}
          className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0"
        >
          {cards && cards.length > 0
            ? cards.map((card, index) => (
                <div
                  key={`custom-${index}`}
                  className={`shrink-0 snap-start ${
                    cardClassName ?? "w-[160px] xs:w-[178px] sm:w-[220px] lg:w-[244px]"
                  }`}
                >
                  <CustomCard card={card} priority={index < 4} />
                </div>
              ))
            : products.map((product, index) => (
                <div
                  key={product.id || product.slug}
                  className={`shrink-0 snap-start ${
                    cardClassName ?? "w-[160px] xs:w-[178px] sm:w-[220px] lg:w-[244px]"
                  }`}
                >
                  <RailCard product={product} overlay={overlay} priority={index < 4} />
                </div>
              ))}
        </div>

        {/* Arrows: only when there is something to scroll in that direction.
            Adding more products in Admin makes the right arrow appear; reaching
            the end makes it disappear. A phone swipes instead. */}
        {!atStart ? (
          <div className="pointer-events-none absolute inset-y-0 -left-1 hidden items-center sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={`Scroll ${title} left`}
              className="pointer-events-auto flex h-9 w-9 translate-x-[-50%] items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-md backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
        {!atEnd ? (
          <div className="pointer-events-none absolute inset-y-0 -right-1 hidden items-center sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label={`Scroll ${title} right`}
              className="pointer-events-auto flex h-9 w-9 translate-x-[50%] items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-md backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

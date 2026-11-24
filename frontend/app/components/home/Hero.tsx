"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeSections } from "@/lib/homepage-content";

/**
 * How long a slide stays on screen, and how long the crossfade takes.
 * Both are 1s so the hero reads as one continuous loop rather than a hard cut
 * followed by a pause. The admin can supply up to four slides.
 */
const SLIDE_DURATION_MS = 1000;

/**
 * The editorial hero — full-bleed campaign image on the right, cream copy
 * block on the left, price hook + yellow CTA on the right.
 *
 * Every field of every slide is admin-editable (Admin → Customize Homepage →
 * Hero); up to four slides, one per card. Slides are stacked and cross-faded,
 * and advance automatically every second. Arrows, dots and pause-on-hover are
 * available so a shopper can hold a slide they are reading.
 */
export default function Hero({ hero }: { hero: HomeSections["hero"] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = hero.slides;
  const total = slides.length;
  const current = slides[Math.min(index, total - 1)];

  // Auto-advance. Paused on hover/focus so the copy can actually be read.
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % total), SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  if (!hero.enabled || total === 0) return null;

  const go = (next: number) => setIndex((next + total) % total);

  return (
    <section
      className="relative overflow-hidden bg-[#f3ecdc]"
      aria-roledescription="carousel"
      aria-label="Campaigns"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      {/* ── Stacked image layers: only the active one is opaque ── */}
      {slides.map((slide, i) => (
        <div
          key={`image-${i}`}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            className="absolute inset-y-0 right-0 h-full w-full object-cover object-top lg:w-[64%]"
          />
          {/* Scrim so the copy stays readable over the photograph. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(90deg,#f3ecdc_0%,#f3ecdc_34%,rgba(243,236,220,0.72)_50%,rgba(243,236,220,0.1)_70%,transparent_86%)]"
          />
        </div>
      ))}

      {/* ── Stacked copy layers, cross-faded with their image ── */}
      <div className="relative mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8">
        <div className="relative min-h-[400px] sm:min-h-[460px] lg:min-h-[560px]">
          {slides.map((slide, i) => (
            <div
              key={`copy-${i}`}
              aria-hidden={i !== index}
              className={`absolute inset-0 flex flex-col justify-center gap-8 py-10 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-14 ${
                i === index ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {/* Left: the campaign copy */}
              <div className={`max-w-xl ${i === index ? "animate-slide-left" : ""}`}>
                {slide.eyebrow ? (
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8a6d3b] sm:text-[11px]">
                    {slide.eyebrow}
                  </p>
                ) : null}

                <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-tight text-[#171512] sm:text-6xl lg:text-7xl">
                  {slide.title}
                </h1>

                {slide.subtitle ? (
                  <p className="mt-3 text-sm font-medium text-[#4b443a] sm:text-base">{slide.subtitle}</p>
                ) : null}

                {slide.hashtag ? (
                  <Link
                    href={slide.hashtagHref || "/product-page"}
                    tabIndex={i === index ? 0 : -1}
                    className="mt-4 inline-block border-b-2 border-[#171512] pb-0.5 text-xs font-black uppercase tracking-[0.16em] text-[#171512] transition-colors hover:border-orange-600 hover:text-orange-600 sm:text-sm"
                  >
                    {slide.hashtag}
                  </Link>
                ) : null}
              </div>

              {/* Right: price hook + CTA */}
              <div className={`shrink-0 lg:text-right ${i === index ? "animate-fade-in" : ""}`}>
                {slide.priceLabel ? (
                  <p className="text-2xl font-black uppercase leading-tight tracking-tight text-[#171512] sm:text-4xl">
                    {slide.priceLabel}
                  </p>
                ) : null}
                <Link
                  href={slide.ctaHref || "/product-page"}
                  tabIndex={i === index ? 0 : -1}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#ffd60a] px-8 py-3.5 text-sm font-black uppercase tracking-wide text-[#171512] shadow-lg shadow-amber-900/10 transition-all hover:bg-[#f5c518] hover:shadow-xl sm:text-base"
                >
                  {slide.ctaLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Carousel controls ── */}
      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#171512] shadow-md backdrop-blur transition-colors hover:bg-white sm:left-4 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#171512] shadow-md backdrop-blur transition-colors hover:bg-white sm:right-4 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-[#171512]" : "w-1.5 bg-[#171512]/30 hover:bg-[#171512]/60"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}

      {/* Announce the current slide for screen readers without a live region
          firing every second (which would be noisy). */}
      <span className="sr-only">{current?.title}</span>
    </section>
  );
}

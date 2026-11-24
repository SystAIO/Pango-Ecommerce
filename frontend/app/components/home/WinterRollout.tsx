import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeSections } from "@/lib/homepage-content";

/**
 * "Winter Rollout" — the big feature banner with a floating product card
 * holding three thumbnails. Background, copy and all three cards are
 * admin-editable.
 */
export default function WinterRollout({
  winterRollout,
}: {
  winterRollout: HomeSections["winterRollout"];
}) {
  if (!winterRollout.enabled) return null;

  const cards = winterRollout.cards.filter((card) => card.image);

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={winterRollout.background}
          alt={winterRollout.title}
          className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(100deg,rgba(9,30,24,0.92)_0%,rgba(9,30,24,0.78)_38%,rgba(9,30,24,0.25)_70%,rgba(9,30,24,0.08)_100%)]"
        />

        <div className="relative flex flex-col gap-8 p-6 sm:p-10 lg:min-h-[380px] lg:justify-between lg:p-12">
          <div className="max-w-xl">
            {winterRollout.eyebrow ? (
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300 sm:text-[11px]">
                {winterRollout.eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {winterRollout.title}
            </h2>
            {winterRollout.subtitle ? (
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
                {winterRollout.subtitle}
              </p>
            ) : null}
            <Link
              href={
                !winterRollout.ctaHref || winterRollout.ctaHref === "/product-page"
                  ? "/winterwear"
                  : winterRollout.ctaHref
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#0b2b23]"
            >
              {winterRollout.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {/* ── Floating product card: three thumbnails ── */}
          {cards.length > 0 ? (
            <div className="flex flex-wrap gap-3 rounded-2xl bg-white/95 p-3 shadow-2xl ring-1 ring-white/40 backdrop-blur sm:gap-4 lg:self-end">
              {cards.map((card, i) => (
                <Link
                  key={i}
                  href={card.slug ? `/product/${card.slug}` : "/product-page"}
                  className="group w-20 animate-scale-in overflow-hidden rounded-xl bg-white sm:w-24 lg:w-28"
                  style={{ animationDelay: `${150 + i * 120}ms` }}
                >
                  <span className="block aspect-square overflow-hidden bg-[#f1ede6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt={card.label}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  {card.label ? (
                    <span className="block truncate px-2 py-1.5 text-[9px] font-black uppercase tracking-wide text-gray-800 sm:text-[10px]">
                      {card.label}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

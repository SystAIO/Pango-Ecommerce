import { Star, BadgeCheck } from "lucide-react";
import type { HomeSections } from "@/lib/homepage-content";

/**
 * "PANGO APPROVED" — social proof as photo cards: a customer picture with the
 * quote, rating and verified-buyer name underneath. Everything (title,
 * subtitle, each review) is editable in Admin → Customize Homepage → Reviews.
 */
export default function Reviews({ reviews }: { reviews: HomeSections["reviews"] }) {
  if (!reviews.enabled || reviews.items.length === 0) return null;

  const items = reviews.items.slice(0, 8);

  return (
    <section className="border-y border-stone-200 bg-[#faf8f5]">
      <div className="mx-auto max-w-[1680px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-lg font-black uppercase tracking-tight text-[#171512] sm:text-2xl">
            {reviews.title}
          </h2>
          {reviews.subtitle ? (
            <p className="mt-1 text-xs font-medium text-stone-500">{reviews.subtitle}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item, index) => (
            <figure
              key={index}
              className="flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {item.image ? (
                <span className="block aspect-[4/3] overflow-hidden bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                </span>
              ) : null}

              <figcaption className="flex flex-1 flex-col p-4">
                <span
                  className="flex items-center gap-0.5"
                  aria-label={`${item.rating} out of 5 stars`}
                >
                  {[...Array(5)].map((_, star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star < item.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-stone-200 text-stone-200"
                      }`}
                      aria-hidden
                    />
                  ))}
                </span>

                <blockquote className="mt-2 line-clamp-4 text-xs leading-relaxed text-stone-700">
                  “{item.text}”
                </blockquote>

                <span className="mt-auto flex items-center gap-2 border-t border-stone-100 pt-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-black text-orange-800">
                    {item.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-bold text-stone-800">
                      {item.name}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      Verified buyer
                    </span>
                  </span>
                </span>

                {item.product ? (
                  <span className="mt-1.5 block truncate text-[9px] font-bold uppercase tracking-wide text-stone-400">
                    {item.product}
                  </span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

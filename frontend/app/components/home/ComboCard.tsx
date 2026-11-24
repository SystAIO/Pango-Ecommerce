import Link from "next/link";
import { Heart, Package } from "lucide-react";
import type { ComboProduct } from "@/lib/combo-data";
import { inr } from "@/lib/site";

/** Card used by the combo listing and related sections. */
export default function ComboCard({ combo, priority = false }: { combo: ComboProduct; priority?: boolean }) {
  const mrp = Number(combo.mrp) || 0;
  const price = Number(combo.price) || 0;
  const off = mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0;

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f1ede6]">
        <Link href={`/combo/${combo.slug}`} className="block h-full w-full" aria-label={combo.name}>
          {combo.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={combo.image}
              alt={combo.name}
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-stone-300" aria-hidden />
            </span>
          )}
        </Link>
        <button type="button" aria-label="Save to wishlist" className="absolute right-2.5 top-2.5 rounded-full bg-white p-2 text-stone-500 shadow-sm">
          <Heart className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="pt-2">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-gray-900">
          <Link href={`/combo/${combo.slug}`} className="hover:text-orange-700">{combo.name}</Link>
        </h3>
        <p className="mt-0.5 text-[12px] text-gray-500">{combo.brand || "Pango"}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-[17px] font-bold tracking-tight text-gray-900">{inr(price)}</span>
          {mrp > price ? <span className="text-[12px] text-gray-400 line-through">{inr(mrp)}</span> : null}
          {off > 0 ? <span className="text-[12px] font-semibold text-green-600">({off}% OFF)</span> : null}
        </div>
        <p className="mt-1 text-[10px] font-medium text-green-700">You save {inr(Math.max(0, mrp - price))}</p>
      </div>
    </article>
  );
}

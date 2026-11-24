import Link from "next/link";
import { Heart, Package } from "lucide-react";
import type { CollectionItem } from "@/lib/collection-data";
import { inr } from "@/lib/site";

/** Product card for the admin-managed new-arrivals and winterwear collections. */
export default function CollectionCard({ item, base, priority = false }: { item: CollectionItem; base: string; priority?: boolean }) {
  const price = Number(item.price) || 0;
  const mrp = Number(item.mrp) || 0;
  const off = mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0;

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f1ede6]">
        <Link href={`/${base}/${item.slug}`} className="block h-full w-full" aria-label={item.name}>
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.name} loading={priority ? "eager" : "lazy"} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <span className="flex h-full w-full items-center justify-center"><Package className="h-10 w-10 text-stone-300" /></span>
          )}
        </Link>
        <button type="button" aria-label="Save to wishlist" className="absolute right-2.5 top-2.5 rounded-full bg-white p-2 text-stone-500 shadow-sm"><Heart className="h-4 w-4" /></button>
      </div>
      <div className="pt-2">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-gray-900">
          <Link href={`/${base}/${item.slug}`} className="hover:text-orange-700">{item.name}</Link>
        </h3>
        <p className="mt-0.5 text-[12px] text-gray-500">{item.brand || "Pango"}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-[17px] font-bold tracking-tight text-gray-900">{inr(price)}</span>
          {mrp > price ? <span className="text-[12px] text-gray-400 line-through">{inr(mrp)}</span> : null}
          {off > 0 ? <span className="text-[12px] font-semibold text-green-600">({off}% OFF)</span> : null}
        </div>
      </div>
    </article>
  );
}

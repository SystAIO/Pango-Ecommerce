"use client";

import Link from "next/link";
import { Heart, Package } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/lib/product-shape";
import { inr } from "@/lib/site";

/**
 * The campaign-style product card used by the New Arrivals grid: a full-bleed
 * photograph with a floating wishlist button and a small category label, then
 * name, category and a price block — no rating, stock line or Add button.
 */
export default function NewArrivalCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { toggleFavorite, isFavorite } = useWishlist();
  const favorited = isFavorite(product.id);
  const label = product.badge || product.category;

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f1ede6]">
        <Link href={`/product/${product.slug}`} className="block h-full w-full" aria-label={product.name}>
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-stone-300" aria-hidden />
            </span>
          )}
        </Link>

        {label ? (
          <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded bg-black/85 px-2 py-1 text-[10px] font-bold text-white">
            {label}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-label={favorited ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={favorited}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:text-rose-500"
        >
          <Heart className={`h-4 w-4 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} aria-hidden />
        </button>
      </div>

      <div className="pt-2">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-gray-900">
          <Link href={`/product/${product.slug}`} className="hover:text-orange-700">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-[12px] text-gray-500">{product.category}</p>
        {!product.inStock ? (
          <p className="mt-1 inline-block rounded bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-700">Out of stock</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[17px] font-bold tracking-tight text-gray-900">
            {product.price > 0 ? inr(product.price) : "On request"}
          </span>
          {product.mrp > product.price ? (
            <span className="text-[12px] text-gray-400 line-through">{inr(product.mrp)}</span>
          ) : null}
          {product.discount ? (
            <span className="text-[12px] font-semibold text-green-600">({product.discount}% OFF)</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

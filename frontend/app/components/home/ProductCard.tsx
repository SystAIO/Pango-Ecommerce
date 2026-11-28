"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Star, Package, Share2, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/lib/product-shape";
import { inr } from "@/lib/site";
import ProductStatBadge from "./ProductStatBadge";

/**
 * The storefront product card.
 *
 * Used by every grid and rail on the homepage, so the hover treatment, price
 * block and action buttons stay identical everywhere.
 *
 * "Add to cart" and the wishlist heart need client state, which is why this is a
 * client component — the homepage itself stays a Server Component and passes
 * plain product data down.
 */
export default function ProductCard({
  product,
  compact = false,
  priority = false,
}: {
  product: Product;
  /** Denser variant for horizontal rails. */
  compact?: boolean;
  /** Eagerly load the image — only worth it for above-the-fold cards. */
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useWishlist();
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  const saved = product.inStock;
  const favorited = isFavorite(product.id);

  function handleAdd() {
    if (!saved) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image_url ?? undefined,
    });
    // Flash a confirmation. The cart badge in the navbar already moves, so this
    // only needs to acknowledge the click, not persist.
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  /**
   * Share the product. Uses the native share sheet where available (mobile);
   * elsewhere falls back to copying the product URL to the clipboard and
   * flashing a check.
   */
  async function handleShare() {
    const url = `${window.location.origin}/product/${product.slug}`;
    const shareData = {
      title: product.name,
      text: `${product.name} — ${product.price > 0 ? inr(product.price) : "On request"}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      throw new Error("Web Share API unavailable");
    } catch (err) {
      // A dismissed share sheet also rejects — that is a choice, not a failure,
      // so only fall back to copying for genuine errors.
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        // Clipboard blocked (permissions policy) — nothing more we can do silently.
      }
    }
  }

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/60">
      {/* ── Badges ── */}
      <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
        {product.discount ? (
          <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
            -{product.discount}%
          </span>
        ) : null}
        <ProductStatBadge product={product} />
      </div>

      {/* ── Wishlist ── */}
      <button
        type="button"
        onClick={() => toggleFavorite(product.id)}
        aria-label={favorited ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={favorited}
        className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm backdrop-blur transition-colors hover:text-rose-500"
      >
        <Heart className={`h-4 w-4 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
      </button>

      {/* ── Image ── */}
      <Link
        href={`/product/${product.slug}`}
        className={`relative block overflow-hidden rounded-t-xl bg-white ${
          compact ? "aspect-[4/3] p-2.5" : "aspect-square p-4"
        }`}
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-gray-200" aria-hidden />
          </div>
        )}
      </Link>

      {/* ── Body ── */}
      <div className={`flex flex-1 flex-col ${compact ? "p-2.5 pt-2" : "p-4"}`}>
        {product.rating > 0 ? (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 rounded bg-orange-600 px-1 py-0.5 text-[10px] font-bold text-white">
              {product.rating.toFixed(1)}
              <Star className="h-2.5 w-2.5 fill-white" aria-hidden />
            </span>
            <span className="text-[10px] text-gray-400">
              {product.review_count > 0
                ? `${product.review_count.toLocaleString("en-IN")} ratings`
                : "New"}
            </span>
          </div>
        ) : null}

        <h3 className="line-clamp-2 text-xs font-medium leading-snug text-gray-900">
          <Link href={`/product/${product.slug}`} className="hover:text-orange-700">
            {product.name}
          </Link>
        </h3>

        {!compact && product.description_intro ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
            {product.description_intro}
          </p>
        ) : null}

        <div className={`mt-auto ${compact ? "pt-2" : "pt-3"}`}>
          {/* Wraps rather than overflowing: in a rail the card can be 164px wide,
              and an Indian-lakhs price plus its struck-through MRP does not fit
              on one line at that size. */}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold tracking-tight text-gray-900">
              {product.price > 0 ? inr(product.price) : "On request"}
            </span>
            {product.mrp > product.price ? (
              <span className="text-[11px] text-gray-400 line-through">
                {inr(product.mrp)}
              </span>
            ) : null}
          </div>

          {saved ? (
            <p className="mt-0.5 text-[10px] font-medium text-green-600">In stock</p>
          ) : (
            <p className="mt-0.5 text-[10px] font-medium text-amber-600">
              {product.stock > 0 ? "Only a few left" : "Out of stock"}
            </p>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="mt-2 flex gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!saved}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-2 font-semibold text-gray-900 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${
              compact ? "py-1.5 text-[10px]" : "py-2 text-[11px]"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
            {added ? "Added" : "Add"}
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label={copied ? "Link copied" : `Share ${product.name}`}
            title={copied ? "Link copied" : "Share"}
            className="flex w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" aria-hidden />
            ) : (
              <Share2 className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
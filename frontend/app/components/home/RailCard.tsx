import Link from "next/link";
import { Package } from "lucide-react";
import type { Product } from "@/lib/product-shape";
import { inr } from "@/lib/site";
import ProductStatBadge from "./ProductStatBadge";

/**
 * The compact card used by the homepage rails (Combos, New Launch, Feels Good).
 *
 * Deliberately simpler than `ProductCard`: an image, an uppercase name and a
 * price block — exactly the treatment the campaign rails use. It is a plain
 * link (server-renderable) rather than a card with buttons, so rails keep
 * working without any client JS.
 */
export default function RailCard({
  product,
  overlay = false,
  priority = false,
}: {
  product: Product;
  /** Renders the category/badge as a dark label over the image. */
  overlay?: boolean;
  /** Eagerly load the image — only worth it for above-the-fold cards. */
  priority?: boolean;
}) {


  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col transition-transform duration-300 hover:-translate-y-1"
    >
      <span className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-[#f1ede6]">
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
            <Package className="h-8 w-8 text-stone-300" aria-hidden />
          </span>
        )}
        {overlay ? (
          <span className="absolute bottom-2 left-2">
            <ProductStatBadge product={product} />
          </span>
        ) : null}
      </span>

      <span className="block pt-2 text-center">
        <span className="block line-clamp-2 text-[11px] font-extrabold uppercase leading-tight tracking-wide text-[#171512]">
          {product.name}
        </span>
        <span className="mt-1 flex flex-wrap items-baseline justify-center gap-x-1.5">
          <span className="text-sm font-black text-[#171512]">
            {product.price > 0 ? inr(product.price) : "On request"}
          </span>
          {product.mrp > product.price ? (
            <span className="text-[11px] text-stone-400 line-through">{inr(product.mrp)}</span>
          ) : null}
          {product.discount ? (
            <span className="text-[11px] font-bold text-green-600">({product.discount}% OFF)</span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}

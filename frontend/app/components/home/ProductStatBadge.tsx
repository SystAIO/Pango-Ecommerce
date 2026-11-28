import { Star } from "lucide-react";
import type { Product } from "@/lib/product-shape";

/** Myntra-style social-proof badge: rating + approximate purchases in K. */
export default function ProductStatBadge({ product }: { product: Product }) {
  const rating = Number(product.rating) || 0;
  const purchases = Number(product.purchaseCount) || 0;
  if (rating <= 0 && purchases <= 0) return null;

  const people = purchases >= 1000 ? `${Math.round(purchases / 1000)}k` : String(purchases);
  return (
    <span className="inline-flex items-center gap-1 rounded bg-white/95 px-2 py-1 text-[10px] font-bold text-[#171512] shadow-sm">
      {rating > 0 ? rating.toFixed(1) : "New"}
      {rating > 0 ? <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" aria-hidden /> : null}
      {purchases > 0 ? (
        <>
          <span className="text-slate-300">|</span>
          {people}
        </>
      ) : null}
    </span>
  );
}

import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import type { HomeCard } from "@/lib/homepage-content";

/**
 * A merchandising card authored entirely in Admin → Customize Homepage.
 *
 * Styled like the campaign product card: a full-bleed photograph with a small
 * dark label, then the description and price. Used when a rail or grid has
 * custom `cards` instead of (or on top of) live catalogue products.
 */
export default function CustomCard({
  card,
  priority = false,
}: {
  card: HomeCard;
  priority?: boolean;
}) {
  return (
    <Link href={card.href || "/product-page"} className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f1ede6]">
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image}
            alt={card.title}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-stone-300" aria-hidden />
          </span>
        )}
        {card.title ? (
          <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded bg-black/85 px-2 py-1 text-[10px] font-bold text-white">
            {card.title}
          </span>
        ) : null}
      </div>

      <div className="pt-2">
        {card.description ? (
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-gray-900">
            {card.description}
          </h3>
        ) : null}
        {card.priceLabel ? (
          <p className="mt-1 text-[17px] font-bold tracking-tight text-gray-900">{card.priceLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}

import Link from "next/link";
import { quickShopHref, type NavbarMenu } from "@/lib/navbar-menu";
import type { HomeSections } from "@/lib/homepage-content";

/**
 * "Quick shop by CATEGORIES" — a grid of rectangular photo tiles, one per
 * department, so a shopper can jump straight into a category. Labels and
 * images are editable in Admin → Customize Homepage → Quick shop; each tile
 * links to the matching category from the (also admin-editable) navbar menu,
 * so a stale link in the saved content can never send a shopper to the wrong
 * category.
 */
export default function QuickShop({
  quickShop,
  menu,
}: {
  quickShop: HomeSections["quickShop"];
  menu: NavbarMenu;
}) {
  if (!quickShop.enabled || quickShop.items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="text-lg font-black uppercase tracking-tight text-[#171512] sm:text-2xl">
          {quickShop.title}
        </h2>
        {quickShop.subtitle ? (
          <p className="mt-1 text-xs font-medium text-stone-500">{quickShop.subtitle}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {quickShop.items.map((item, index) => (
          <Link
            key={index}
            href={quickShopHref(item.label, item.href, menu)}
            className="group flex animate-scale-in flex-col"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200 transition-all duration-300 group-hover:ring-2 group-hover:ring-orange-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.label}
                loading="lazy"
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
            </span>
            {/* The reference sets the category label below the photo on white. */}
            <span className="pt-2 text-center text-[11px] font-black uppercase tracking-wide text-[#171512]">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

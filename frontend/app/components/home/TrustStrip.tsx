import { Banknote, RotateCcw, Truck } from "lucide-react";
import type { HomeSections } from "@/lib/homepage-content";
import { csvList } from "@/lib/homepage-content";

const ICONS = [Banknote, RotateCcw, Truck] as const;

/** COD / easy returns / delivery strip under the rollout banner. */
export default function TrustStrip({ trustStrip }: { trustStrip: HomeSections["trustStrip"] }) {
  if (!trustStrip.enabled) return null;

  const items = csvList(trustStrip.items).slice(0, 3);
  if (items.length === 0) return null;

  return (
    <div className="border-y border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-center gap-y-2 px-4 py-4 sm:px-6 lg:px-8">
        {items.map((item, index) => {
          const Icon = ICONS[index] ?? Truck;
          return (
            <div key={index} className="flex items-center gap-2.5 whitespace-nowrap">
              {index > 0 ? <span aria-hidden className="mx-4 h-5 w-px bg-stone-300 sm:mx-8" /> : null}
              <Icon className="h-4 w-4 text-orange-600" aria-hidden />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-800 sm:text-[11px]">
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

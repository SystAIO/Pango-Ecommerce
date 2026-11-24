import { Smartphone } from "lucide-react";
import type { HomeSections } from "@/lib/homepage-content";

/**
 * The prepaid/UPI offer strip under the hero — a rounded cream banner with a
 * generic UPI mark (drawn, not a trademark file) and admin-editable copy.
 */
export default function UpiBanner({ upiBanner }: { upiBanner: HomeSections["upiBanner"] }) {
  if (!upiBanner.enabled) return null;

  return (
    <section className="mx-auto max-w-[1680px] px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-amber-200 bg-[linear-gradient(90deg,#fffbe7_0%,#fff3c4_50%,#fffbe7_100%)] px-5 py-4 shadow-sm">
        {/* Drawn UPI mark — not a reproduced trademark asset */}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#3b3833] bg-white px-3 py-1.5 text-xs font-black italic leading-none text-[#1d1b17] shadow-sm">
          <Smartphone className="h-3.5 w-3.5" aria-hidden />
          UPI
        </span>

        <div className="text-center">
          <p className="text-base font-black uppercase tracking-wide text-orange-600 sm:text-2xl">
            {upiBanner.title}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[#6b5b14] sm:text-sm">
            {upiBanner.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}

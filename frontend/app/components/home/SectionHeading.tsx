import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The centred section heading used by every homepage block: uppercase title,
 * a muted subtitle, and an optional "View all" link on the right (or centred).
 *
 * Copy is admin-editable — this component only renders what it is given.
 */
export default function SectionHeading({
  title,
  subtitle,
  href,
  badge,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  /** Small tinted pill under the heading (e.g. a combo offer). */
  badge?: string;
}) {
  return (
    <div className="mb-5 text-center sm:mb-6">
      <h2 className="text-lg font-black uppercase tracking-tight text-[#171512] sm:text-2xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-xs font-medium text-stone-500 sm:text-sm">{subtitle}</p>
      ) : null}
      {badge ? (
        <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
          {badge}
        </span>
      ) : null}
      {href ? (
        <Link
          href={href}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-stone-600 transition-colors hover:text-orange-600 sm:text-xs"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

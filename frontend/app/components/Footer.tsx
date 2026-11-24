"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ShieldCheck,
  Smartphone,
  Truck,
  Mail,
  Package,
} from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

/**
 * Minimal hand-drawn social glyphs (the installed icon set ships no brand
 * icons). Simple geometry, drawn for this file — not reproduced artwork.
 */
const SocialIcon = ({ name, className = "h-4 w-4" }: { name: string; className?: string }) => {
  switch (name) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M14.5 8.5H16V5.5h-2.2c-2.5 0-3.8 1.7-3.8 4v2H7.8v3h2.2v6.5h3V14.5h2.3l.4-3h-2.7v-1.7c0-.8.3-1.3 1.5-1.3Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M6.94 8.5v11H4.06v-11h2.88ZM5.5 3.75A1.72 1.72 0 1 1 5.5 7.2a1.72 1.72 0 0 1 0-3.44ZM10 12.2h2.76v1.52h.04c.38-.73 1.34-1.5 2.76-1.5 2.95 0 3.5 1.94 3.5 4.46v5.32H16.3v-4.7c0-1.12-.02-2.56-1.56-2.56-1.56 0-1.8 1.22-1.8 2.48v4.78H10v-11Z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M4 4h3.6l6.1 8.9L17.5 4H20l-6.4 9.3L20.3 21h-3.6l-6.2-9L6.9 21H4l6.5-9.4L4 4Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M22 12c0-2.7-.3-4.9-.6-6.4a2.6 2.6 0 0 0-1.8-2C18 3.2 12 3.2 12 3.2s-6 0-7.6.4a2.6 2.6 0 0 0-1.8 2C2.3 7.1 2 9.3 2 12s.3 4.9.6 6.4a2.6 2.6 0 0 0 1.8 2c1.6.4 7.6.4 7.6.4s6 0 7.6-.4a2.6 2.6 0 0 0 1.8-2c.3-1.5.6-3.7.6-6.4ZM10.4 15V9.5l5.3 2.8-5.3 2.7Z" />
        </svg>
      );
    default:
      return null;
  }
};

const SUPPORT_LINKS = [
  { label: "Track Order", href: "/user-dashboard" },
  { label: "Returns & Exchange Policy", href: "/user-dashboard" },
  { label: "FAQ's", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Shipping Policy", href: "#" },
  { label: "Contact Us", href: `mailto:${SITE.email}` },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "#" },
  { label: "Collaboration", href: `mailto:${SITE.email}` },
  { label: "Career", href: "#" },
  { label: "Media", href: "#" },
  { label: "Pango Blog", href: "#" },
  { label: "Sitemap", href: "#" },
];

const CATEGORY_LINKS = [
  "Hoodies",
  "T-Shirts",
  "Shirts",
  "Jeans",
  "Jackets",
  "Joggers",
  "Sweatshirts",
  "Sweaters",
  "Co-ord Sets",
  "Trackpants",
];

const PAYMENT_METHODS = ["UPI", "Razorpay", "COD", "RuPay", "Net Banking", "EMI"];

const SOCIALS = [
  { label: "Instagram", href: "#", name: "instagram" },
  { label: "LinkedIn", href: "#", name: "linkedin" },
  { label: "Facebook", href: "#", name: "facebook" },
  { label: "X", href: "#", name: "x" },
  { label: "YouTube", href: "#", name: "youtube" },
];

export default function Footer() {
  const [openSection, setOpenSection] = useState<"why" | "categories" | null>("why");

  return (
    <footer className="bg-[#191919] text-[#e8e6e3]">
      <div className="mx-auto max-w-[1680px] px-5 pt-12 sm:px-8 lg:px-12">
        {/* ── Columns ── */}
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <Link href="/" aria-label="Pango Apparels — home" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pango-logo.png"
                alt="Pango Apparels"
                className="h-24 w-auto rounded-md bg-white object-contain p-1.5"
              />
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-[#a8a49e]">
              {SITE.pitch}
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">
              Support
            </h3>
            <ul className="mt-3 space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs text-[#c9c6c0] transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">
              Company
            </h3>
            <ul className="mt-3 space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs text-[#c9c6c0] transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">
              Location
            </h3>
            <a href={`mailto:${SITE.email}`} className="mt-3 block text-sm font-semibold text-white transition-colors hover:text-orange-400">
              {SITE.email}
            </a>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-[#c9c6c0]">
              Pango Apparels, {SITE.address}
            </p>
            <a
              href={whatsappLink("Hi Pango Apparels — I have a question.")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:border-orange-500 hover:text-orange-400"
            >
              <Package className="h-3.5 w-3.5" aria-hidden />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <div className="my-8 h-px bg-white/10" />

        {/* ── Accordion: Why choose us ── */}
        <div className="border-t border-white/10">
          <button
            type="button"
            onClick={() => setOpenSection((s) => (s === "why" ? null : "why"))}
            aria-expanded={openSection === "why"}
            className="flex w-full items-center justify-between py-5 text-left"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white">
              Why Choose Us
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#c9c6c0] transition-transform duration-300 ${
                openSection === "why" ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
          {openSection === "why" ? (
            <div className="pb-6">
              <h4 className="text-sm font-bold text-white">
                Pango Apparels — An Affordable Online Shopping Site in India
              </h4>
              <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[#c9c6c0]">
                Online shopping was rapidly gaining popularity, yet affordable and trendy options were
                limited. When “fashion” was too often synonymous with high-end and pricey labels, a
                simple idea took shape: bring genuinely good winter clothing — fleece-lined hoodies,
                puffer jackets, heavyweight tees and co-ord sets — to every Indian closet at an honest
                price. That idea grew into Pango Apparels, cut and stitched for Indian winters with
                30-day easy exchanges and pan-India delivery.
              </p>
              <button type="button" className="mt-4 text-xs font-bold text-white underline underline-offset-4 transition-colors hover:text-orange-400">
                Read More +
              </button>
            </div>
          ) : null}
        </div>

        {/* ── Accordion: Popular categories ── */}
        <div className="border-t border-white/10">
          <button
            type="button"
            onClick={() => setOpenSection((s) => (s === "categories" ? null : "categories"))}
            aria-expanded={openSection === "categories"}
            className="flex w-full items-center justify-between py-5 text-left"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white">
              Popular Categories
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#c9c6c0] transition-transform duration-300 ${
                openSection === "categories" ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
          {openSection === "categories" ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pb-6 sm:grid-cols-3 md:grid-cols-5">
              {CATEGORY_LINKS.map((category) => (
                <Link
                  key={category}
                  href={`/product-page?category=${encodeURIComponent(category)}`}
                  className="text-xs text-[#c9c6c0] transition-colors hover:text-white"
                >
                  {category}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="my-6 h-px bg-white/10" />

        {/* ── Secure payment + socials ── */}
        <div className="grid gap-8 pb-4 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden />
              100% Secure Payment
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#e8e6e3]"
                >
                  <Smartphone className="h-3 w-3 text-[#a8a49e]" aria-hidden />
                  {method}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#e8e6e3]">
                <Truck className="h-3 w-3 text-[#a8a49e]" aria-hidden />
                Delivery
              </span>
            </div>
          </div>

          <div className="md:justify-self-end">
            <h3 className="text-sm font-bold text-white">Follow us to see our cooler side</h3>
            <div className="mt-3 flex items-center gap-3">
              {SOCIALS.map(({ label, href, name }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[#e8e6e3] transition-all hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
                >
                  <SocialIcon name={name} className="h-4 w-4" />
                </a>
              ))}
              <a
                href={`mailto:${SITE.email}`}
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[#e8e6e3] transition-all hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
              >
                <Mail className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a8a49e]">
          Copyright © 2026 Pango Apparels. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Heart,
  Loader2, MapPin, PackageCheck, RotateCcw, Share2, ShieldCheck, ShoppingCart,
  Truck, Users, X,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ComboCard from "@/app/components/home/ComboCard";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { inr } from "@/lib/site";
import { DEFAULT_COMBO_DATA, type ComboData, type ComboProduct } from "@/lib/combo-data";
import type { SizeGuideRow } from "@/lib/catalog-config";
import { DEFAULT_CATALOG_CONFIG } from "@/lib/catalog-config";

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-200">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between py-3 text-left text-sm font-bold text-slate-900">
        {title}
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="pb-4 text-[13px] leading-6 text-slate-600">{children}</div> : null}
    </div>
  );
}

function SizeGuideDrawer({ rows, howTo, onClose }: { rows: SizeGuideRow[]; howTo: string; onClose: () => void }) {
  const [unit, setUnit] = useState<"IN" | "CM">("IN");
  const convert = (raw: string) => {
    if (unit === "IN" || !raw) return raw;
    const m = raw.match(/-?\d+(?:\.\d+)?/);
    return m ? raw.replace(m[0], String(Math.round(parseFloat(m[0]) * 2.54 * 10) / 10)) : raw;
  };
  return (
    <div className="fixed inset-0 z-[400] flex justify-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label="Size guide">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Size Guide</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-slate-200 p-0.5 text-xs font-bold">
              {(["IN", "CM"] as const).map((u) => <button key={u} type="button" onClick={() => setUnit(u)} className={`rounded-full px-3 py-1.5 ${unit === u ? "bg-slate-900 text-white" : "text-slate-500"}`}>{u}</button>)}
            </div>
            <button type="button" onClick={onClose} aria-label="Close size guide" className="rounded-full border border-slate-200 p-2"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <table className="mt-6 w-full border-collapse text-left text-sm">
          <thead><tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-500"><th className="py-3">Size</th><th>Chest</th><th>Length</th><th>Shoulder</th><th>Sleeve</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.size} className="border-b border-slate-100"><td className="py-3 font-bold">{r.size}</td><td>{convert(r.chest)}</td><td>{convert(r.length)}</td><td>{convert(r.shoulder)}</td><td>{convert(r.sleeve)}</td></tr>)}</tbody>
        </table>
        <p className="mt-3 text-center text-xs text-slate-500">All measurements of the garment are (in {unit === "IN" ? "Inches" : "cm"})</p>
        <h3 className="mt-8 text-base font-bold">How To Measure:</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{howTo}</p>
      </div>
    </div>
  );
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-800">{label}</span>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-500"
        >
          <option value="">Select</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
      </div>
    </label>
  );
}

export default function ComboDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [data, setData] = useState<ComboData>(DEFAULT_COMBO_DATA);
  const [guide, setGuide] = useState(DEFAULT_CATALOG_CONFIG);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [color1, setColor1] = useState("");
  const [color2, setColor2] = useState("");
  const [size1, setSize1] = useState("");
  const [size2, setSize2] = useState("");
  const [comboError, setComboError] = useState("");
  const [applied, setApplied] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [recent, setRecent] = useState<ComboProduct[]>([]);

  const { addItem, setBuyNowItem } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/combos").then((r) => (r.ok ? r.json() : null)).then((d: ComboData | null) => d && setData(d)).catch(() => {});
    fetch("/api/catalog-config").then((r) => (r.ok ? r.json() : null)).then((d) => d && setGuide(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setImageIndex(0);
    setApplied(false);
    const found = data.combos.find((c) => c.slug === slug);
    if (found) {
      setLoading(false);
      try {
        const key = "pango-recent-combos";
        const raw = JSON.parse(window.localStorage.getItem(key) || "[]") as ComboProduct[];
        const kept = [found, ...raw.filter((p) => p.slug !== slug)].slice(0, 8);
        window.localStorage.setItem(key, JSON.stringify(kept));
        setRecent(kept.filter((p) => p.slug !== slug));
      } catch { /* ignore */ }
    } else {
      // Data may still be loading — retry on next tick via the data dependency.
      const t = window.setTimeout(() => setLoading(false), 400);
      return () => window.clearTimeout(t);
    }
  }, [slug, data.combos]);

  const combo = data.combos.find((c) => c.slug === slug);
  const comboId = 900000 + Math.max(0, data.combos.findIndex((c) => c.slug === slug));
  const coupon = data.coupon;
  const price = Number(combo?.price) || 0;
  const mrp = Number(combo?.mrp) || 0;
  const off = mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0;
  const discount = coupon.active && coupon.minOrder <= price && coupon.value > 0
    ? Math.min(price, coupon.kind === "percent" ? Math.round((price * coupon.value) / 100) : coupon.value)
    : 0;
  const effectivePrice = applied ? Math.max(0, price - discount) : price;

  const images = useMemo(() => {
    if (!combo) return [];
    return combo.images.length > 0 ? combo.images : [combo.image || "/product-placeholder.svg"];
  }, [combo]);

  const similar = useMemo(() => data.combos.filter((c) => c.slug !== slug && c.category === combo?.category).slice(0, 5), [data.combos, slug, combo?.category]);

  const validate = () => {
    if (!combo) return false;
    if (combo.colors.length > 0 && (!color1 || !color2)) { setComboError("Please select both colours."); return false; }
    if (combo.sizes.length > 0 && (!size1 || !size2)) { setComboError("Please select both sizes."); return false; }
    setComboError("");
    return true;
  };

  const cartItem = () => {
    const parts = [color1, color2, size1, size2].filter(Boolean).join(" / ");
    return {
      productId: comboId,
      slug: slug!,
      name: `${combo!.name}${parts ? ` (${parts})` : ""}`,
      price: effectivePrice,
      image: images[imageIndex] || combo!.image,
      size: parts || undefined,
      color: [color1, color2].filter(Boolean).join(" / ") || undefined,
    };
  };

  const handleAdd = () => {
    if (!validate()) return;
    addItem(cartItem());
    setNotice("Added to bag");
    window.setTimeout(() => setNotice(""), 1800);
  };
  const handleBuy = () => {
    if (!validate()) return;
    const item = cartItem();
    addItem(item);
    if (!user) { router.push(`/login?next=/combo/${slug}`); return; }
    setBuyNowItem(item);
    router.push("/checkout");
  };

  if (loading || !combo) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
          {loading ? <Loader2 className="h-6 w-6 animate-spin text-orange-600" /> : (
            <>
              <h1 className="text-2xl font-bold">Combo not found</h1>
              <Link href="/combo-page" className="text-sm font-bold text-orange-600">Back to combos</Link>
            </>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#171512]">
      <Navbar />
      <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6 lg:px-10">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
          <Link href="/" className="hover:text-orange-600">Home</Link><ChevronRight className="h-3 w-3" />
          <Link href="/combo-page" className="hover:text-orange-600">Combos</Link><ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-stone-800">{combo.name}</span>
        </nav>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_600px]">
          {/* Gallery */}
          <div className="flex w-full gap-3">
            <div className="hidden w-[74px] shrink-0 flex-col gap-2 sm:flex">
              {images.map((src, i) => (
                <button key={i} type="button" onClick={() => setImageIndex(i)} aria-label={`View image ${i + 1}`} className={`aspect-[4/5] overflow-hidden rounded-lg border-2 bg-stone-100 ${i === imageIndex ? "border-orange-500" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover object-top" />
                </button>
              ))}
            </div>
            <div className="group min-w-0 flex-1">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f1ede6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[imageIndex]} alt={combo.name} className="h-full w-full object-cover object-top" />
                {combo.badge ? <span className="absolute bottom-3 left-3 rounded bg-black/85 px-3 py-1.5 text-[11px] font-bold text-white">{combo.badge}</span> : null}
                <button type="button" onClick={() => toggleFavorite(comboId)} aria-label="Save to wishlist" className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-sm">
                  <Heart className={`h-5 w-5 ${isFavorite(comboId) ? "fill-rose-500 text-rose-500" : "text-stone-500"}`} />
                </button>
                {images.length > 1 ? (
                  <>
                    <button type="button" onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)} aria-label="Previous" className="absolute left-3 top-1/2 rounded-full bg-white/80 p-2 opacity-0 group-hover:opacity-100"><ChevronLeft className="h-5 w-5" /></button>
                    <button type="button" onClick={() => setImageIndex((i) => (i + 1) % images.length)} aria-label="Next" className="absolute right-3 top-1/2 rounded-full bg-white/80 p-2 opacity-0 group-hover:opacity-100"><ChevronRight className="h-5 w-5" /></button>
                  </>
                ) : null}
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto sm:hidden">
                {images.map((src, i) => <button key={i} type="button" onClick={() => setImageIndex(i)} className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${i === imageIndex ? "border-orange-500" : "border-stone-200"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>)}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-teal-700">{combo.brand}</span>
            </div>
            <h1 className="mt-1 text-xl font-bold leading-snug text-slate-900">{combo.name}</h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{inr(effectivePrice)}</span>
              {mrp > price ? <span className="text-sm text-slate-400 line-through">{inr(mrp)}</span> : null}
              {off > 0 ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{off}% OFF</span> : null}
            </div>

            {/* Coupon */}
            {coupon.active && coupon.value > 0 ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-black">₹</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{coupon.label}</p>
                  <p className="text-[11px] text-slate-600">{coupon.description}</p>
                  <p className="mt-1 text-[10px] font-semibold text-amber-800">Code: {coupon.code}</p>
                </div>
                <button type="button" onClick={() => setApplied((v) => !v)} className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-black uppercase ${applied ? "border-emerald-500 bg-emerald-500 text-white" : "border-amber-500 bg-white text-amber-800 hover:bg-amber-100"}`}>
                  {applied ? "Applied ✓" : "Apply coupon"}
                </button>
              </div>
            ) : null}
            {applied && discount > 0 ? <p className="mt-2 text-[11px] font-bold text-emerald-700">Coupon applied — you save {inr(discount)} extra</p> : null}

            {/* Select Combos */}
            <div className="mt-5 border-t border-stone-200 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Select Combos</h2>
                <button type="button" onClick={() => setGuideOpen(true)} className="text-xs font-bold text-sky-700 hover:underline">Size Guide ›</button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SelectField label="Color 1" options={combo.colors} value={color1} onChange={setColor1} />
                <SelectField label="Size 1" options={combo.sizes} value={size1} onChange={setSize1} />
                <SelectField label="Color 2" options={combo.colors} value={color2} onChange={setColor2} />
                <SelectField label="Size 2" options={combo.sizes} value={size2} onChange={setSize2} />
              </div>
              {comboError ? <p className="mt-2 text-[11px] font-semibold text-rose-600">{comboError}</p> : null}
            </div>

            <button type="button" className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white">Eligible for returns under our 7-day return policy</button>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleAdd} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800"><ShoppingCart className="h-4 w-4" /> Add to Cart</button>
              <button type="button" onClick={() => toggleFavorite(comboId)} aria-label="Wishlist" className="rounded-lg border border-stone-300 p-3 text-stone-600"><Heart className="h-4 w-4" /></button>
              <button type="button" onClick={handleBuy} className="flex-1 rounded-lg bg-amber-400 py-3 text-sm font-black text-slate-900 hover:bg-amber-300">Buy Now</button>
            </div>
            {notice ? <p className="mt-2 text-center text-xs font-bold text-emerald-700">{notice}</p> : null}

            <div className="mt-6 rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-bold">Check Delivery Date</p>
              <div className="mt-2 flex gap-2">
                <input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter Pincode" inputMode="numeric" className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-amber-500" />
                <button type="button" onClick={() => setPincodeResult(pincode.length === 6 ? `Delivery by ${new Date(Date.now() + 4 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · COD available` : "Enter a valid 6-digit pincode")} className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white">Check</button>
              </div>
              {pincodeResult ? <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><MapPin className="h-3 w-3" />{pincodeResult}</p> : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-around gap-3 rounded-xl bg-stone-50 py-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-teal-600" />7 Days Returns</span>
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-teal-600" />Free Delivery</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-teal-600" />Assured Refund</span>
            </div>

            <div className="mt-6 border-t border-stone-200">
              <Accordion title="Product Details" defaultOpen>
                <table className="w-full text-[13px]"><tbody>
                  {Object.entries(combo.specs).map(([k, v]) => <tr key={k} className="border-b border-stone-100"><td className="py-2 pr-3 font-semibold capitalize text-slate-700">{k}</td><td className="py-2 text-slate-600">{v}</td></tr>)}
                </tbody></table>
              </Accordion>
              <Accordion title="Description"><p>{combo.description || "No description provided."}</p></Accordion>
              <Accordion title="Returns, Exchange & Refund Policy"><p>7 days easy returns and exchange. Refunds are processed to the original payment method.</p></Accordion>
              <Accordion title="Marked By"><p>{combo.brand}</p></Accordion>
            </div>
          </div>
        </div>

        {/* Product insights */}
        {(combo.insights.length > 0 ? combo.insights : data.insights).length > 0 ? (
          <section className="mt-14">
            <h2 className="mb-5 text-lg font-bold">Product Insights</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(combo.insights.length > 0 ? combo.insights : data.insights).map((insight, i) => (
                <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={insight.image} alt={insight.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-sm font-black text-white">{insight.title}</p>
                    <p className="text-[11px] text-white/80">{insight.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-14 flex flex-wrap items-center justify-around gap-6 border-y border-stone-100 py-8">
          <span className="flex items-center gap-2 text-sm font-bold"><PackageCheck className="h-6 w-6 text-teal-600" />Genuine Product</span>
          <span className="flex items-center gap-2 text-sm font-bold"><Users className="h-6 w-6 text-teal-600" />3M+ Happy Customers</span>
          <span className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-6 w-6 text-teal-600" />Make In India</span>
        </section>

        {recent.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-5 text-lg font-bold">Recently Viewed</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{recent.map((c) => <ComboCard key={c.slug} combo={c} />)}</div>
          </section>
        ) : null}

        {similar.length > 0 ? (
          <section className="mt-12">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Similar Products</h2><Link href="/combo-page" className="text-xs font-bold text-orange-600">View All <ArrowRight className="inline h-3.5 w-3.5" /></Link></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{similar.map((c) => <ComboCard key={c.slug} combo={c} />)}</div>
          </section>
        ) : null}

        <div className="mt-8 flex justify-end">
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setNotice("Link copied"); window.setTimeout(() => setNotice(""), 1500); } catch { /* ignore */ } }} className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-orange-600"><Share2 className="h-4 w-4" />Share this combo</button>
        </div>
      </main>

      {guideOpen ? <SizeGuideDrawer rows={guide.sizeGuide} howTo={guide.sizeGuideHowTo} onClose={() => setGuideOpen(false)} /> : null}
      <Footer />
    </div>
  );
}

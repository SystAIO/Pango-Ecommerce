"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Heart,
  Loader2, MapPin, PackageCheck, RotateCcw, ShieldCheck, ShoppingCart, Truck, Users,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import CollectionCard from "./CollectionCard";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { inr } from "@/lib/site";
import { DEFAULT_COLLECTIONS, type CollectionData, type CollectionItem, type CollectionKey } from "@/lib/collection-data";

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-200">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between py-3 text-left text-sm font-bold text-slate-900">
        {title}<ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="pb-4 text-[13px] leading-6 text-slate-600">{children}</div> : null}
    </div>
  );
}

export default function CollectionDetail({ collectionKey, slug, label }: { collectionKey: CollectionKey; slug: string; label: string }) {
  const router = useRouter();
  const [data, setData] = useState<CollectionData>(DEFAULT_COLLECTIONS[collectionKey]);
  const [pageLabel, setPageLabel] = useState(label);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState("");
  const [selectError, setSelectError] = useState("");
  const [applied, setApplied] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState("");
  const [notice, setNotice] = useState("");

  const { addItem, setBuyNowItem } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    fetch(`/api/collections/${collectionKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CollectionData | null) => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [collectionKey]);

  useEffect(() => {
    fetch("/api/navbar-menu")
      .then((r) => (r.ok ? r.json() : null))
      .then((menu: { links?: { label: string; href: string }[] } | null) => {
        const match = menu?.links?.find((l) => l.href === `/${collectionKey}`);
        if (match?.label) setPageLabel(match.label);
      })
      .catch(() => setPageLabel(label));
  }, [collectionKey, label]);

  useEffect(() => { setImageIndex(0); setApplied(false); setSize(""); }, [slug]);

  const item = data.items.find((i) => i.slug === slug);
  const itemId = 800000 + Math.max(0, data.items.findIndex((i) => i.slug === slug));
  const price = Number(item?.price) || 0;
  const mrp = Number(item?.mrp) || 0;
  const off = mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0;
  const coupon = data.coupon;
  const saving = coupon.active && coupon.minOrder <= price && coupon.value > 0
    ? Math.min(price, coupon.kind === "percent" ? Math.round((price * coupon.value) / 100) : coupon.value)
    : 0;
  const effectivePrice = applied ? Math.max(0, price - saving) : price;
  const images = useMemo(() => (item ? (item.images.length ? item.images : [item.image || "/product-placeholder.svg"]) : []), [item]);
  const similar = useMemo(() => data.items.filter((i) => i.slug !== slug && i.category === item?.category).slice(0, 5), [data.items, slug, item?.category]);

  const validate = () => {
    if (item && item.sizes.length > 0 && !size) { setSelectError("Please select a size."); return false; }
    setSelectError("");
    return true;
  };
  const cartItem = () => ({
    productId: itemId, slug, name: item!.name, price: effectivePrice,
    image: images[imageIndex] || item!.image, size: size || undefined,
  });
  const handleAdd = () => {
    if (!validate()) return;
    addItem(cartItem());
    setNotice("Added to bag");
    window.setTimeout(() => setNotice(""), 1800);
  };
  const handleBuy = () => {
    if (!validate()) return;
    const cart = cartItem();
    addItem(cart);
    if (!user) { router.push(`/login?next=/${collectionKey}/${slug}`); return; }
    setBuyNowItem(cart);
    router.push("/checkout");
  };

  if (loading) return <div className="min-h-screen"><Navbar /><div className="flex justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-orange-600" /></div><Footer /></div>;
  if (!item) return (
    <div className="min-h-screen"><Navbar /><div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <Link href={`/${collectionKey}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-600">Back to {label} <ArrowRight className="h-4 w-4" /></Link>
    </div><Footer /></div>
  );

  return (
    <div className="min-h-screen bg-white text-[#171512]">
      <Navbar />
      <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6 lg:px-10">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
          <Link href="/" className="hover:text-orange-600">Home</Link><ChevronRight className="h-3 w-3" />
          <Link href={`/${collectionKey}`} className="hover:text-orange-600">{pageLabel}</Link><ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-stone-800">{item.name}</span>
        </nav>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_600px]">
          <div className="flex w-full gap-3">
            <div className="hidden w-[74px] shrink-0 flex-col gap-2 sm:flex">
              {images.map((src, i) => <button key={i} type="button" onClick={() => setImageIndex(i)} aria-label={`Image ${i + 1}`} className={`aspect-[4/5] overflow-hidden rounded-lg border-2 bg-stone-100 ${i === imageIndex ? "border-orange-500" : "border-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover object-top" />
              </button>)}
            </div>
            <div className="group min-w-0 flex-1">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f1ede6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[imageIndex]} alt={item.name} className="h-full w-full object-cover object-top" />
                {item.badge ? <span className="absolute bottom-3 left-3 rounded bg-black/85 px-3 py-1.5 text-[11px] font-bold text-white">{item.badge}</span> : null}
                <button type="button" onClick={() => toggleFavorite(itemId)} aria-label="Wishlist" className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-sm">
                  <Heart className={`h-5 w-5 ${isFavorite(itemId) ? "fill-rose-500 text-rose-500" : "text-stone-500"}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-teal-700">{item.brand}</p>
            <h1 className="mt-1 text-xl font-bold leading-snug text-slate-900">{item.name}</h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{inr(effectivePrice)}</span>
              {mrp > price ? <span className="text-sm text-slate-400 line-through">{inr(mrp)}</span> : null}
              {off > 0 ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{off}% OFF</span> : null}
            </div>

            {coupon.active && coupon.value > 0 && coupon.minOrder <= price ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 font-black">₹</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{coupon.label}</p>
                  <p className="text-[11px] text-slate-600">{coupon.description}</p>
                  <p className="mt-1 text-[10px] font-semibold text-amber-800">Code: {coupon.code}</p>
                </div>
                <button type="button" onClick={() => setApplied((v) => !v)} className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-black uppercase ${applied ? "border-emerald-500 bg-emerald-500 text-white" : "border-amber-500 bg-white text-amber-800 hover:bg-amber-100"}`}>
                  {applied ? "Applied ✓" : "Apply coupon"}
                </button>
              </div>
            ) : null}
            {applied && saving > 0 ? <p className="mt-2 text-[11px] font-bold text-emerald-700">Coupon applied — you save {inr(saving)} extra</p> : null}

            {item.sizes.length > 0 ? (
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">Size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.sizes.map((s) => <button key={s} type="button" onClick={() => { setSize(s); setSelectError(""); }} aria-pressed={size === s} className={`h-10 min-w-12 rounded-lg border px-3 text-xs font-bold ${size === s ? "border-amber-500 bg-amber-50" : "border-stone-300"}`}>{s}</button>)}
                </div>
              </div>
            ) : null}
            {selectError ? <p className="mt-2 text-[11px] font-semibold text-rose-600">{selectError}</p> : null}

            <button type="button" className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white">Eligible for returns under our 7-day return policy</button>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleAdd} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800"><ShoppingCart className="h-4 w-4" /> Add to Cart</button>
              <button type="button" onClick={() => toggleFavorite(itemId)} aria-label="Wishlist" className="rounded-lg border border-stone-300 p-3 text-stone-600"><Heart className="h-4 w-4" /></button>
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
                  {Object.entries(item.specs).map(([k, v]) => <tr key={k} className="border-b border-stone-100"><td className="py-2 pr-3 font-semibold capitalize text-slate-700">{k}</td><td className="py-2 text-slate-600">{v}</td></tr>)}
                </tbody></table>
              </Accordion>
              <Accordion title="Description"><p>{item.description || "No description provided."}</p></Accordion>
              <Accordion title="Returns, Exchange & Refund Policy"><p>7 days easy returns and exchange. Refunds are processed to the original payment method.</p></Accordion>
              <Accordion title="Marked By"><p>{item.brand}</p></Accordion>
            </div>
          </div>
        </div>

        {(item.insights.length > 0 ? item.insights : data.insights).length > 0 ? (
          <section className="mt-14">
            <h2 className="mb-5 text-lg font-bold">Product Insights</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(item.insights.length > 0 ? item.insights : data.insights).map((insight, i) => (
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

        {similar.length > 0 ? (
          <section className="mt-12">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Similar Products</h2><Link href={`/${collectionKey}`} className="text-xs font-bold text-orange-600">View All <ArrowRight className="inline h-3.5 w-3.5" /></Link></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{similar.map((s) => <CollectionCard key={s.slug} item={s} base={collectionKey} />)}</div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

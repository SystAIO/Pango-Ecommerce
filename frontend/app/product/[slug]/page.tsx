"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Heart,
  Loader2, MapPin, PackageCheck, RotateCcw, Share2, ShieldCheck, ShoppingCart,
  Star, Truck, Users, X, ThumbsUp, ThumbsDown, BadgeCheck,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { inr } from "@/lib/site";
import type { SizeGuideRow } from "@/lib/catalog-config";
import { DEFAULT_CATALOG_CONFIG } from "@/lib/catalog-config";

type ColorVariant = { name: string; images: string[] };

const COLOR_HEX: Record<string, string> = {
  black: "#111111", blue: "#2563eb", brown: "#7c3f22", green: "#22a06b",
  grey: "#9ca3af", gray: "#9ca3af", maroon: "#7f1d1d", white: "#ffffff",
  navy: "#1e3a8a", red: "#dc2626", yellow: "#eab308", beige: "#d6c3a5",
  olive: "#6b7a3a", teal: "#0d9488", pink: "#ec4899",
};

function parseSpecifications(specs: unknown): {
  flat: Record<string, string>;
  variants: ColorVariant[];
} {
  const flat: Record<string, string> = {};
  const variants: ColorVariant[] = [];
  const walk = (obj: Record<string, unknown>, section?: string) => {
    if (!obj || typeof obj !== "object") return;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        flat[key.toLowerCase().trim()] = value;
        if (section && section.toLowerCase().includes("color variant")) {
          const urls = value.split(",").map((s) => s.trim()).filter(Boolean);
          if (urls.length) variants.push({ name: key.trim(), images: urls });
        }
      } else if (value && typeof value === "object") {
        walk(value as Record<string, unknown>, key);
      }
    }
  };
  walk((specs ?? {}) as Record<string, unknown>);
  return { flat, variants };
}

function splitValues(value: string): string[] {
  return value.split(/[,/|;]/).map((s) => s.trim()).filter(Boolean);
}

function PriceLine({ price, mrp }: { price: number; mrp: number }) {
  const p = Number(price) || 0;
  const m = Number(mrp) || 0;
  const off = m > p && p > 0 ? Math.round((1 - p / m) * 100) : 0;
  return (
    <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
      <span className="text-xs font-bold text-slate-900">{inr(p)}</span>
      {m > p ? <span className="text-[11px] text-slate-400 line-through">{inr(m)}</span> : null}
      {off > 0 ? <span className="text-[11px] font-semibold text-green-600">({off}% OFF)</span> : null}
    </div>
  );
}

function Accordion({
  title, children, defaultOpen = false,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-bold text-slate-900"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="pb-4 text-[13px] leading-6 text-slate-600">{children}</div> : null}
    </div>
  );
}

/** The slide-in size guide, matching the reference: unit toggle, table, diagram, how-to. */
function SizeGuideDrawer({
  rows, howTo, onClose,
}: {
  rows: SizeGuideRow[];
  howTo: string;
  onClose: () => void;
}) {
  const [unit, setUnit] = useState<"IN" | "CM">("IN");
  const convert = (raw: string) => {
    if (unit === "IN" || !raw) return raw;
    const match = raw.match(/-?\d+(?:\.\d+)?/);
    if (!match) return raw;
    const value = Math.round(parseFloat(match[0]) * 2.54 * 10) / 10;
    return raw.replace(match[0], String(value));
  };

  return (
    <div className="fixed inset-0 z-[400] flex justify-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label="Size guide">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Size Guide</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-slate-200 p-0.5 text-xs font-bold">
              {(["IN", "CM"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`rounded-full px-3 py-1.5 ${unit === u ? "bg-slate-900 text-white" : "text-slate-500"}`}
                >
                  {u}
                </button>
              ))}
            </div>
            <button type="button" onClick={onClose} aria-label="Close size guide" className="rounded-full border border-slate-200 p-2 text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-black uppercase tracking-wide text-slate-500">
                <th className="py-3">Size</th><th>Chest</th><th>Length</th><th>Shoulder</th><th>Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.size} className="border-b border-slate-100">
                  <td className="py-3 font-bold text-slate-900">{row.size}</td>
                  <td>{convert(row.chest)}</td>
                  <td>{convert(row.length)}</td>
                  <td>{convert(row.shoulder)}</td>
                  <td>{convert(row.sleeve)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-center text-xs text-slate-500">All measurements of the garment are (in {unit === "IN" ? "Inches" : "cm"})</p>

          <div className="my-8 flex justify-center">
            <svg viewBox="0 0 300 360" className="h-80 w-auto" role="img" aria-label="Jacket measurement diagram">
              <path d="M110 40 L150 55 L190 40 L235 70 L255 130 L225 145 L210 110 L210 315 L90 315 L90 110 L75 145 L45 130 L65 70 Z"
                fill="#f8fafc" stroke="#0f766e" strokeWidth="2" />
              <path d="M150 55 L150 315" stroke="#0f766e" strokeDasharray="4 4" opacity="0.6" />
              <path d="M90 120 L210 120" stroke="#0f766e" strokeDasharray="4 4" />
              <path d="M90 110 L90 315 M210 110 L210 315" stroke="#0f766e" strokeDasharray="4 4" />
              <g fontSize="10" fontWeight="700" fill="#334155">
                <text x="240" y="100">SHOULDER</text><line x1="190" y1="96" x2="238" y2="96" stroke="#334155" />
                <text x="225" y="135">CHEST</text><line x1="205" y1="132" x2="222" y2="132" stroke="#334155" />
                <text x="5" y="200">LENGTH</text><line x1="50" y1="196" x2="86" y2="196" stroke="#334155" />
                <text x="225" y="250">SLEEVE</text><line x1="208" y1="246" x2="222" y2="246" stroke="#334155" />
              </g>
            </svg>
          </div>

          <h3 className="text-base font-bold text-slate-900">How To Measure:</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{howTo}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [config, setConfig] = useState(DEFAULT_CATALOG_CONFIG);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const { addItem, setBuyNowItem } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/catalog-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setConfig(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/reviews?productSlug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setReviews(data.reviews ?? []);
          setReviewSummary(data.summary ?? { average: 0, count: 0 });
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setGalleryIndex(0);
    setSelectedSize("");
    setSelectedColor("");
    setAppliedCode("");
    fetch(`/api/products/${slug}`)
      .then((r) => (r.ok ? r.json() : { product: null }))
      .then((data) => {
        const next = data.product || null;
        setProduct(next);
        setLoading(false);
        if (next) {
          try {
            const key = "pango-recently-viewed";
            const raw = JSON.parse(window.localStorage.getItem(key) || "[]") as any[];
            const kept = [next, ...raw.filter((p) => p.slug !== next.slug)].slice(0, 8);
            window.localStorage.setItem(key, JSON.stringify(kept));
            setRecentlyViewed(kept.filter((p) => p.slug !== next.slug));
          } catch { /* ignore */ }
        }
      })
      .catch(() => setLoading(false));
    fetch("/api/products?limit=500")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => setAllProducts(data.products ?? []))
      .catch(() => setAllProducts([]));
  }, [slug]);

  const { flat, variants } = useMemo(() => parseSpecifications(product?.specifications), [product]);
  const colorNames = variants.length > 0
    ? variants.map((v) => v.name)
    : splitValues(flat["color"] ?? "");
  const activeVariant = variants.find((v) => v.name === selectedColor);
  const galleryImages = activeVariant?.images?.length
    ? activeVariant.images
    : [
        ...(Array.isArray(product?.images) ? product.images : []),
        ...(product?.image_url ? [product.image_url] : []),
      ];
  const images = galleryImages.length > 0 ? galleryImages : ["/product-placeholder.svg"];
  const sizes = splitValues(flat["sizes"] ?? flat["size"] ?? "");
  const price = Number(product?.price) || 0;
  const mrp = Number(product?.mrp) || 0;
  const discount = mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0;

  const applicableCoupons = config.coupons.filter((c) => c.active && c.minOrder <= price && c.value > 0);
  const appliedCoupon = applicableCoupons.find((c) => c.code === appliedCode);
  const couponSaving = appliedCoupon
    ? Math.min(price, appliedCoupon.kind === "percent" ? Math.round((price * appliedCoupon.value) / 100) : appliedCoupon.value)
    : 0;
  const effectivePrice = Math.max(0, price - couponSaving);

  const similar = useMemo(() => {
    const others = allProducts.filter((p) => p.slug !== slug);
    return [...others.filter((p) => p.category === product?.category), ...others.filter((p) => p.category !== product?.category)].slice(0, 5);
  }, [allProducts, product?.category, slug]);

  const pickColor = (name: string) => {
    setSelectedColor(name);
    setGalleryIndex(0);
  };

  const requireSize = (): boolean => {
    if (sizes.length > 0 && !selectedSize) {
      setSizeError("Please select a size.");
      return false;
    }
    setSizeError("");
    return true;
  };

  const handleAdd = () => {
    if (!requireSize() || !product) return;
    addItem({
      productId: Number(product.id), slug: product.slug, name: product.name, price: effectivePrice,
      image: activeVariant?.images?.[0] ?? product.image_url ?? undefined, size: selectedSize || undefined, color: selectedColor || undefined,
    });
    setNotice("Added to bag");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const handleBuy = () => {
    if (!requireSize() || !product) return;
    if (!user) { router.push(`/login?next=/product/${slug}`); return; }
    addItem({
      productId: Number(product.id), slug: product.slug, name: product.name, price: effectivePrice,
      image: activeVariant?.images?.[0] ?? product.image_url ?? undefined, size: selectedSize || undefined, color: selectedColor || undefined,
    });
    setBuyNowItem({
      productId: Number(product.id), slug: product.slug, name: product.name, price: effectivePrice,
      image: activeVariant?.images?.[0] ?? product.image_url ?? undefined, size: selectedSize || undefined, color: selectedColor || undefined, quantity,
    });
    router.push("/checkout");
  };

  const voteHelpful = async (review: any, vote: "up" | "down") => {
    try {
      const res = await fetch(`/api/reviews/${review.id}/helpful`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (data.review) setReviews((prev) => prev.map((r) => (r.id === review.id ? data.review : r)));
    } catch { /* ignore */ }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: product?.name, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-orange-600" /></div>;
  }
  if (!product) {
    return (
      <div className="min-h-screen"><Navbar /><div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/product-page" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-600">Back to products <ArrowRight className="h-4 w-4" /></Link>
      </div><Footer /></div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#171512]">
      <Navbar />

      <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6 lg:px-10">
        {/* Breadcrumbs */}
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/product-page?category=${encodeURIComponent(product.category)}`} className="hover:text-orange-600">Men&apos;s New Arrival</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-stone-800">{product.name}</span>
        </nav>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_600px]">
          {/* ── GALLERY ── */}
          <div className="flex w-full gap-3">
            <div className="hidden w-[74px] shrink-0 flex-col gap-2 sm:flex">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGalleryIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`aspect-[4/5] overflow-hidden rounded-lg border-2 bg-stone-100 ${i === galleryIndex ? "border-orange-500" : "border-transparent"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover object-top" />
                </button>
              ))}
            </div>
            <div className="group relative min-w-0 flex-1">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f1ede6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[galleryIndex]} alt={product.name} className="h-full w-full object-cover object-top" />
                {product.badge || product.category ? (
                  <span className="absolute bottom-3 left-3 rounded bg-black/85 px-3 py-1.5 text-[11px] font-bold text-white">
                    {product.badge || product.category}
                  </span>
                ) : null}
                <button type="button" onClick={() => toggleFavorite(Number(product.id))} aria-label="Save to wishlist" className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-sm">
                  <Heart className={`h-5 w-5 ${isFavorite(Number(product.id)) ? "fill-rose-500 text-rose-500" : "text-stone-500"}`} />
                </button>
                {images.length > 1 ? (
                  <>
                    <button type="button" onClick={() => setGalleryIndex((i) => (i - 1 + images.length) % images.length)} aria-label="Previous image" className="absolute left-3 top-1/2 rounded-full bg-white/80 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={() => setGalleryIndex((i) => (i + 1) % images.length)} aria-label="Next image" className="absolute right-3 top-1/2 rounded-full bg-white/80 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto sm:hidden">
                {images.map((src, i) => (
                  <button key={i} type="button" onClick={() => setGalleryIndex(i)} className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${i === galleryIndex ? "border-orange-500" : "border-stone-200"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── DETAILS ── */}
          <div className="min-w-0">
            <p className="text-xs font-bold text-teal-700">{product.brand || "Pango"}</p>
            <h1 className="mt-1 text-xl font-bold leading-snug text-slate-900">{product.name}</h1>

            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{inr(effectivePrice)}</span>
              {mrp > price ? <span className="text-sm text-slate-400 line-through">{inr(mrp)}</span> : null}
              {discount > 0 ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{discount}% OFF</span> : null}
              {couponSaving > 0 ? (
                <span className="w-full text-[11px] font-bold text-emerald-700">
                  Coupon {appliedCode} applied — you save {inr(couponSaving)} extra
                </span>
              ) : null}
            </div>

            {/* Coupons — applying one instantly reduces the displayed price */}
            {applicableCoupons.length > 0 ? (
              <div className="mt-4 space-y-2">
                {applicableCoupons.map((coupon) => {
                  const isApplied = appliedCode === coupon.code;
                  return (
                    <div key={coupon.code} className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-xs">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-black">₹</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">{coupon.label}</p>
                        <p className="text-[11px] text-slate-600">{coupon.description}</p>
                        <p className="mt-1 text-[10px] font-semibold text-amber-800">Code: {coupon.code}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAppliedCode(isApplied ? "" : coupon.code)}
                        className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-black uppercase transition-colors ${
                          isApplied
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-amber-500 bg-white text-amber-800 hover:bg-amber-100"
                        }`}
                      >
                        {isApplied ? "Applied ✓" : "Apply coupon"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Color selection — images change with the chosen color */}
            {colorNames.length > 0 ? (
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                  Color{selectedColor ? ` (${selectedColor})` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorNames.map((name) => {
                    const variant = variants.find((v) => v.name === name);
                    const thumb = variant?.images?.[0];
                    const active = selectedColor === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => pickColor(name)}
                        title={name}
                        aria-pressed={active}
                        className={`h-12 w-12 overflow-hidden rounded-lg border-2 bg-stone-100 ${active ? "border-orange-500 ring-2 ring-orange-100" : "border-stone-300"}`}
                        style={!thumb ? { backgroundColor: COLOR_HEX[name.toLowerCase()] ?? "#d6d3d1" } : undefined}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={name} className="h-full w-full object-cover object-top" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Size */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">Size</span>
                <button type="button" onClick={() => setSizeGuideOpen(true)} className="text-xs font-bold text-sky-700 hover:underline">Size Guide ›</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(sizes.length > 0 ? sizes : ["S", "M", "L", "XL", "XXL"]).map((size) => (
                  <button key={size} type="button" onClick={() => { setSelectedSize(size); setSizeError(""); }} aria-pressed={selectedSize === size}
                    className={`h-10 min-w-12 rounded-lg border px-3 text-xs font-bold ${selectedSize === size ? "border-amber-500 bg-amber-50 text-slate-900" : "border-stone-300 text-slate-700"}`}>
                    {size}
                  </button>
                ))}
              </div>
              {sizeError ? <p className="mt-1 text-[11px] font-semibold text-rose-600">{sizeError}</p> : null}
            </div>

            {!product.inStock ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center">
                <p className="text-sm font-black uppercase tracking-wide text-rose-700">Out of stock</p>
                <p className="mt-0.5 text-[11px] text-rose-600">This product is currently unavailable. Check back soon.</p>
              </div>
            ) : null}

            <button type="button" className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white">
              Eligible for returns under our 7-day return policy
            </button>

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleAdd} disabled={!product.inStock} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                <ShoppingCart className="h-4 w-4" /> {product.inStock ? "Add to Cart" : "Out of stock"}
              </button>
              <button type="button" onClick={() => toggleFavorite(Number(product.id))} aria-label="Wishlist" className="rounded-lg border border-stone-300 p-3 text-stone-600">
                <Heart className={`h-4 w-4 ${isFavorite(Number(product.id)) ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
              <button type="button" onClick={handleBuy} disabled={!product.inStock} className="flex-1 rounded-lg bg-amber-400 py-3 text-sm font-black text-slate-900 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Buy Now</button>
            </div>
            {notice ? <p className="mt-2 text-center text-xs font-bold text-emerald-700">{notice}</p> : null}

            {/* Delivery check */}
            <div className="mt-6 rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-bold text-slate-900">Check Delivery Date</p>
              <div className="mt-2 flex gap-2">
                <input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter Pincode" inputMode="numeric" className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-amber-500" />
                <button type="button" onClick={() => setPincodeResult(pincode.length === 6 ? `Delivery by ${new Date(Date.now() + 4 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · COD available` : "Enter a valid 6-digit pincode")} className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white">Check</button>
              </div>
              {pincodeResult ? <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><MapPin className="h-3 w-3" />{pincodeResult}</p> : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-around gap-3 rounded-xl bg-stone-50 py-3 text-[10px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-teal-600" />7 Days Returns</span>
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-teal-600" />Free Delivery</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-teal-600" />Assured Refund</span>
            </div>

            {/* Product details accordions */}
            <div className="mt-6 border-t border-stone-200">
              <Accordion title="Product Details" defaultOpen>
                <table className="w-full text-[13px]">
                  <tbody>
                    {Object.entries(flat).filter(([k]) => !["color", "sizes", "size", "combos"].includes(k)).map(([key, value]) => (
                      <tr key={key} className="border-b border-stone-100">
                        <td className="py-2 pr-3 font-semibold capitalize text-slate-700">{key.replace(/_/g, " ")}</td>
                        <td className="py-2 text-slate-600">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Accordion>
              <Accordion title="Description"><p>{product.description_intro || "No description provided."}</p></Accordion>
              <Accordion title="Returns, Exchange & Refund Policy"><p>7 days easy returns and exchange. Refunds are processed to the original payment method.</p></Accordion>
              <Accordion title="Marked By"><p>{product.brand || "Pango Apparels"}</p></Accordion>
              <Accordion title="Ratings & Reviews">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 py-1.5 text-sm font-black text-slate-900">
                    {reviewSummary.average.toFixed(1)}
                    <Star className="h-3.5 w-3.5 fill-slate-900 text-slate-900" aria-hidden />
                  </span>
                  <span className="text-xs text-slate-500">
                    {reviewSummary.count} Ratings | {reviewSummary.count} Reviews
                  </span>
                </div>
                {reviewSummary.count > 0 ? (
                  <button type="button" onClick={() => setReviewsOpen(true)} className="mt-3 block text-xs font-bold text-sky-700 hover:underline">
                    View all {reviewSummary.count} reviews ›
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No reviews yet — be the first to review this product.</p>
                )}
              </Accordion>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <section className="mt-16 flex flex-wrap items-center justify-around gap-6 border-y border-stone-100 py-8">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><PackageCheck className="h-6 w-6 text-teal-600" />Genuine Product</span>
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><Users className="h-6 w-6 text-teal-600" />3M+ Happy Customers</span>
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><CheckCircle2 className="h-6 w-6 text-teal-600" />Make In India</span>
        </section>

        {/* Recently viewed */}
        {recentlyViewed.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-5 text-lg font-bold">Recently Viewed</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {recentlyViewed.map((item) => (
                <Link key={item.slug} href={`/product/${item.slug}`} className="group">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url || "/product-placeholder.svg"} alt={item.name} className="h-full w-full object-cover object-top transition-transform group-hover:scale-105" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] font-semibold text-slate-800">{item.name}</p>
                  <PriceLine price={item.price} mrp={item.mrp} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Similar products */}
        {similar.length > 0 ? (
          <section className="mt-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Similar Products</h2>
              <Link href="/product-page" className="text-xs font-bold text-orange-600">View All <ArrowRight className="inline h-3.5 w-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {similar.map((item) => (
                <Link key={item.slug} href={`/product/${item.slug}`} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url || "/product-placeholder.svg"} alt={item.name} className="h-full w-full object-cover object-top transition-transform group-hover:scale-105" />
                    {item.badge ? <span className="absolute left-2 top-2 rounded bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-white">{item.badge}</span> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] font-semibold text-slate-800">{item.name}</p>
                  <PriceLine price={item.price} mrp={item.mrp} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 flex justify-end">
          <button type="button" onClick={share} className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-orange-600">
            <Share2 className="h-4 w-4" />{copied ? "Link copied" : "Share this product"}
          </button>
        </div>
      </main>

      {/* Customer reviews — mirrors the reference review cards */}
      {reviewsOpen ? (
        <div className="fixed inset-0 z-[390] flex items-center justify-center bg-black/50 p-4" onClick={() => setReviewsOpen(false)} role="dialog" aria-modal="true" aria-label="Customer reviews">
          <div className="max-h-[86vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Customer Reviews</h2>
                <p className="text-[11px] text-slate-400">{reviewSummary.count} verified reviews</p>
              </div>
              <button type="button" onClick={() => setReviewsOpen(false)} aria-label="Close reviews" className="rounded-full bg-slate-100 p-2 text-slate-500"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />{Number(review.rating).toFixed(1)}
                    </span>
                    <span className="text-xs text-stone-500">Verified Buyer</span>
                    <BadgeCheck className="h-4 w-4 text-emerald-600" aria-hidden />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.text}</p>
                  <div className="mt-4 flex items-center justify-end gap-3 text-[11px] text-stone-500">
                    <span>Helpful?</span>
                    <button type="button" onClick={() => void voteHelpful(review, "up")} className="inline-flex items-center gap-1 hover:text-emerald-600"><ThumbsUp className="h-3.5 w-3.5" />{review.helpfulUp}</button>
                    <button type="button" onClick={() => void voteHelpful(review, "down")} className="inline-flex items-center gap-1 hover:text-rose-600"><ThumbsDown className="h-3.5 w-3.5" />{review.helpfulDown}</button>
                  </div>
                </div>
              ))}
              {reviews.length === 0 ? <p className="text-sm text-slate-400">No approved reviews yet.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {sizeGuideOpen ? (
        <SizeGuideDrawer rows={config.sizeGuide} howTo={config.sizeGuideHowTo} onClose={() => setSizeGuideOpen(false)} />
      ) : null}

      <Footer />
    </div>
  );
}

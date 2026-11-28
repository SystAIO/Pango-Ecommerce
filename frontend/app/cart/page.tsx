"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Heart,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useCart, type CartItem } from "@/context/CartContext";
import { computeTotals, FREE_SHIPPING_ABOVE } from "@/lib/pricing";
import { referralDiscount, type ReferralConfig } from "@/lib/referral-config";
import { formatINR } from "@/lib/validation";
import type { Product } from "@/lib/product-shape";

/**
 * The bag. Guests can review items, check delivery charges and apply a referral
 * code. "Place order" sends them to sign in/sign up, then on to checkout.
 */
export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, ready, updateQuantity, removeItem, addItem } = useCart();

  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralConfig, setReferralConfig] = useState<ReferralConfig | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/referral-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ReferralConfig | null) => data && setReferralConfig(data))
      .catch(() => {});
    fetch("/api/products?limit=10")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { products?: Product[] } | null) =>
        setRecommendations((data?.products ?? []).slice(0, 10))
      )
      .catch(() => {});
  }, []);

  const totals = useMemo(
    () => computeTotals(items.map((i) => ({ unit_price: i.price, quantity: i.quantity })), pincode),
    [items, pincode]
  );
  const discount = referralConfig
    ? referralDiscount(referralConfig, referralCode, totals.subtotal)
    : 0;
  const total = Math.max(0, totals.total - discount);

  const mrpTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const goToCheckout = () => {
    router.push(user ? "/checkout" : "/login?next=/checkout");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-xs font-bold text-slate-500">Loading your bag…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Pango Apparels — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pango-logo.png" alt="Pango Apparels" className="h-16 w-auto object-contain sm:h-20" />
          </Link>
          <nav className="hidden items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] sm:flex">
            <span className="border-b-2 border-teal-600 pb-0.5 text-teal-700">Cart</span>
            <span className="w-10 border-t border-dashed border-slate-300" />
            <span className="text-slate-400">Address</span>
            <span className="w-10 border-t border-dashed border-slate-300" />
            <span className="text-slate-400">Payment</span>
          </nav>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="h-5 w-5" aria-hidden />
            <span className="hidden text-[11px] font-black uppercase sm:inline">100% Secure</span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Delivery check */}
            <section className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-black text-[#171512]">Check delivery time &amp; services</p>
                <div className="flex gap-2">
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter pincode"
                    inputMode="numeric"
                    className="w-32 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (pincode.length !== 6) {
                        setPincodeResult("Enter a valid 6-digit pincode");
                        return;
                      }
                      const charge = computeTotals(
                        items.map((i) => ({ unit_price: i.price, quantity: i.quantity })),
                        pincode
                      ).shipping;
                      setPincodeResult(
                        charge === 0
                          ? "Free delivery to this pincode"
                          : `Delivery charge ${formatINR(charge)} · COD available`
                      );
                    }}
                    className="rounded-lg border border-rose-500 px-4 py-2 text-[11px] font-black uppercase text-rose-600 hover:bg-rose-500 hover:text-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
              {pincodeResult ? (
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <MapPin className="h-3 w-3" /> {pincodeResult}
                </p>
              ) : null}
            </section>

            {/* Bag items */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <p className="text-xs font-black uppercase text-[#171512]">
                  {items.reduce((n, i) => n + i.quantity, 0)}/{items.length} items selected
                </p>
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                  <button type="button" onClick={() => items.forEach((i) => removeItem(i.productId, i.size))} className="hover:text-rose-600">
                    Remove
                  </button>
                  <span className="text-slate-200">|</span>
                  <Link href="/user-dashboard?tab=wishlist" className="hover:text-orange-600">Move to wishlist</Link>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <Package className="h-8 w-8 text-slate-300" aria-hidden />
                  <p className="text-sm font-semibold text-slate-500">Your bag is empty</p>
                  <Link href="/product-page" className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white">
                    Browse products
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item: CartItem) => (
                    <div key={`${item.productId}-${item.size ?? ""}`} className="flex gap-4 py-4">
                      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image || "/product-placeholder.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover object-top"
                        />
                        <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-teal-600 text-white">
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="line-clamp-2 text-sm font-bold text-slate-900">{item.name}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">Sold by: Pango Apparels</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId, item.size)}
                            aria-label="Remove item"
                            className="text-lg font-bold text-slate-400 hover:text-rose-600"
                          >
                            ×
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {item.size ? (
                            <span className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold">Size: {item.size}</span>
                          ) : null}
                          <select
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, Number(e.target.value), item.size)}
                            className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold"
                          >
                            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Qty: {n}</option>)}
                          </select>
                        </div>
                        <div className="mt-3 flex flex-wrap items-baseline gap-2">
                          <span className="text-base font-black text-slate-900">{formatINR(item.price)}</span>
                        </div>
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Heart className="h-3 w-3" aria-hidden /> 7 days return available
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!user ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-600">
                    Login to see items from your existing bag and wishlist.
                  </p>
                  <Link href="/login?next=/cart" className="text-[11px] font-black uppercase text-rose-600 hover:underline">
                    Login now
                  </Link>
                </div>
              ) : null}
            </section>

            {/* Referral */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-black text-slate-900">Apply referral code</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Have a code? Enter it here — the discount is recalculated on the server at checkout.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                  placeholder="E.G. PANGO10"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = referralInput.trim().toUpperCase();
                    if (referralConfig?.active && code === referralConfig.code) {
                      setReferralCode(code);
                    } else {
                      setReferralCode("");
                    }
                  }}
                  className="rounded-lg border border-rose-500 px-5 py-2 text-[11px] font-black uppercase text-rose-600 hover:bg-rose-500 hover:text-white"
                >
                  Apply
                </button>
                {referralCode ? (
                  <button type="button" onClick={() => { setReferralCode(""); setReferralInput(""); }} className="rounded-lg px-3 py-2 text-[11px] font-bold text-slate-500">
                    Remove
                  </button>
                ) : null}
              </div>
              {referralCode ? (
                <p className="mt-2 text-[11px] font-semibold text-emerald-700">
                  {referralConfig?.percent ?? 0}% referral discount applied.
                </p>
              ) : null}
            </section>
          </div>

          {/* Price details */}
          <aside>
            <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-black text-slate-900">Price details ({items.length} items)</p>
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span>Total MRP</span>
                  <span className="font-semibold">{formatINR(mrpTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Discount on MRP</span>
                  <span className="font-semibold">− {formatINR(Math.max(0, mrpTotal - totals.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coupon discount</span>
                  <span className="font-semibold">{discount > 0 ? `− ${formatINR(discount)}` : "Apply coupon"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold">{totals.shipping === 0 ? "Free" : formatINR(totals.shipping)}</span>
                </div>
                {totals.amountToFreeShipping > 0 && totals.subtotal > 0 ? (
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-[11px] font-semibold text-amber-800">
                      Add {formatINR(totals.amountToFreeShipping)} more for free shipping
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-200">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${Math.min(100, (totals.subtotal / FREE_SHIPPING_ABOVE) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-black">Total amount</span>
                <span className="text-xl font-black">{formatINR(total)}</span>
              </div>
              <button
                type="button"
                onClick={goToCheckout}
                disabled={items.length === 0}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-600/20 transition-colors hover:bg-rose-700 disabled:opacity-60"
              >
                <Lock className="h-4 w-4" aria-hidden /> Place order
              </button>
              <Link href="/product-page" className="mt-3 block text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600">
                Continue shopping
              </Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-400">
                <ShieldCheck className="h-3 w-3" /> 100% secure checkout
              </p>
            </div>
          </aside>
        </div>

        {recommendations.length > 0 ? (
          <section className="mt-12 rounded-3xl border border-rose-100 bg-rose-50/40 p-5 sm:p-7">
            <h2 className="text-lg font-black text-[#171512]">You may also like:</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {recommendations.map((product) => (
                <div key={product.id || product.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <Link href={`/product/${product.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image_url || "/product-placeholder.svg"} alt={product.name} className="aspect-[4/5] w-full object-cover object-top" />
                  </Link>
                  <div className="p-3">
                    <p className="line-clamp-2 text-[11px] font-bold text-slate-800">{product.name}</p>
                    <p className="mt-1 text-[11px] font-black text-slate-900">{formatINR(product.price)}</p>
                    <button
                      type="button"
                      onClick={() => addItem({
                        productId: Number(product.id),
                        slug: product.slug,
                        name: product.name,
                        price: product.price,
                        image: product.image_url || undefined,
                        quantity: 1,
                      })}
                      className="mt-2 w-full rounded-lg border border-rose-500 py-1.5 text-[10px] font-black uppercase text-rose-600 hover:bg-rose-500 hover:text-white"
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

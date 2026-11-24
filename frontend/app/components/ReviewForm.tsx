"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Star, BadgeCheck, Clock3, XCircle } from "lucide-react";

type OwnReview = {
  id: number;
  productSlug: string;
  productName: string;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type PurchasedProduct = { slug: string; name: string; image: string };

const statusTone = (s: string) =>
  s === "approved" ? "bg-emerald-50 text-emerald-700"
    : s === "pending" ? "bg-amber-50 text-amber-700"
    : "bg-rose-50 text-rose-700";

export default function ReviewForm() {
  const [products, setProducts] = useState<PurchasedProduct[]>([]);
  const [reviews, setReviews] = useState<OwnReview[]>([]);
  const [slug, setSlug] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, reviewsRes] = await Promise.all([
        fetch("/api/orders", { credentials: "include" }),
        fetch("/api/reviews?mine=1", { credentials: "include" }),
      ]);
      const ordersData = await ordersRes.json();
      const reviewsData = await reviewsRes.json();
      const seen = new Set<string>();
      const bought: PurchasedProduct[] = [];
      for (const order of ordersData.orders ?? []) {
        for (const item of order.items ?? []) {
          const key = String(item.product_slug ?? "");
          if (!key || seen.has(key)) continue;
          seen.add(key);
          bought.push({ slug: key, name: String(item.product_name ?? key), image: String(item.product_image ?? "") });
        }
      }
      setProducts(bought);
      setReviews(reviewsData.reviews ?? []);
      if (bought.length > 0) setSlug(bought[0].slug);
    } catch {
      setNotice("Could not load your purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selected = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);

  const submit = async () => {
    if (!slug || !text.trim()) { setNotice("Choose a product and write your review."); return; }
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productSlug: slug,
          productName: selected?.name ?? slug,
          productImage: selected?.image ?? "",
          rating,
          text: text.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review");
      setText("");
      setRating(5);
      setNotice(
        rating < 3
          ? "Thanks — your review was sent for admin verification before publishing."
          : "Thanks! Your review is now live on the product page."
      );
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading reviews…</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Ratings &amp; Reviews</h2>
        <p className="mt-1 text-xs text-slate-500">Review products you have purchased. Reviews below 3 stars are verified by our team before they appear publicly.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-[11px] font-bold uppercase text-slate-500">
            Product
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-orange-500">
              {products.length === 0 ? <option value="">No purchased products yet</option> : null}
              {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </label>
          <div className="text-[11px] font-bold uppercase text-slate-500">
            Your rating
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} className="p-0.5">
                  <Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                </button>
              ))}
              <span className="ml-2 text-sm font-black normal-case text-slate-700">{rating}.0</span>
            </div>
          </div>
        </div>

        <label className="mt-4 block text-[11px] font-bold uppercase text-slate-500">
          Your review
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you like? How was the fit and quality?" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-orange-500" />
        </label>

        {notice ? <p className="mt-2 text-[11px] font-semibold text-orange-600">{notice}</p> : null}

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => void submit()} disabled={saving || products.length === 0} className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50">
            {saving ? "Submitting…" : "Submit review"}
          </button>
          {selected ? <Link href={`/product/${selected.slug}`} className="text-xs font-bold text-sky-700 hover:underline">View product ↗</Link> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900">Your reviews ({reviews.length})</h3>
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-900"><Star className="h-3 w-3 fill-amber-500 text-amber-500" />{r.rating}.0</span>
                <span className="text-xs font-semibold text-slate-700">{r.productName}</span>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusTone(r.status)}`}>
                  {r.status === "approved" ? <BadgeCheck className="h-3 w-3" /> : r.status === "pending" ? <Clock3 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {r.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{r.text}</p>
              {r.status === "pending" ? <p className="mt-1 text-[10px] text-amber-600">Awaiting admin verification</p> : null}
            </div>
          ))}
          {reviews.length === 0 ? <p className="text-xs text-slate-400">You have not written any reviews yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

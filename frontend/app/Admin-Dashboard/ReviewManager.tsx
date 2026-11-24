"use client";

/** Admin → Review Ratings: verify low-rated reviews before they go public. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Clock3, Loader2, RefreshCw, Search, Star, X, XCircle } from "lucide-react";

type Review = {
  id: number;
  productId: number;
  productSlug: string;
  productName: string;
  userName: string;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
  helpfulUp: number;
  helpfulDown: number;
  createdAt: string;
};

const tone = (s: string) =>
  s === "approved" ? "bg-emerald-50 text-emerald-700"
    : s === "pending" ? "bg-amber-50 text-amber-700"
    : "bg-rose-50 text-rose-700";

export default function ReviewManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load reviews");
      setReviews(data.reviews ?? []);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => reviews.filter((r) => {
    const selected = String(filter);
    if (selected !== "all" && selected !== "low" && r.status !== selected) return false;
    if (selected === "low" && r.rating >= 3) return false;
    if (search && !`${r.productName} ${r.userName} ${r.text}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [reviews, filter, search]);

  const setStatus = async (review: Review, status: "approved" | "rejected" | "pending") => {
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update review");
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status } : r)));
      setNotice(`Review ${status}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update review");
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading reviews…</div>;

  const pending = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Review Ratings</h2>
          <p className="mt-1 text-xs text-slate-500">
            Reviews with 3+ stars publish instantly. Reviews below 3 stars wait here for your verification.
          </p>
          {notice ? <p className="mt-1 text-[11px] font-semibold text-orange-600">{notice}</p> : null}
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total reviews", value: reviews.length, icon: Star, color: "bg-orange-50 text-orange-600" },
          { label: "Awaiting verification", value: pending, icon: Clock3, color: "bg-amber-50 text-amber-600" },
          { label: "Published", value: reviews.filter((r) => r.status === "approved").length, icon: BadgeCheck, color: "bg-emerald-50 text-emerald-600" },
          { label: "Low rated (below 3★)", value: reviews.filter((r) => r.rating < 3).length, icon: XCircle, color: "bg-rose-50 text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</p><p className="mt-1 text-xl font-black text-slate-900">{s.value}</p></div>
              <span className={`rounded-xl p-2 ${s.color}`}><s.icon className="h-5 w-5" /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, customer or review text…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-orange-500" />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold">
            <option value="all">All reviews</option>
            <option value="pending">Pending verification</option>
            <option value="approved">Published</option>
            <option value="rejected">Rejected</option>
            <option value="low">Below 3 stars</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3">Review</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="align-top hover:bg-slate-50/60">
                  <td className="px-3 py-3"><span className="block max-w-[180px] truncate text-xs font-bold text-slate-800">{r.productName}</span><Link href={`/product/${r.productSlug}`} target="_blank" className="text-[10px] font-semibold text-orange-600 hover:underline">View product ↗</Link></td>
                  <td className="px-3 py-3 text-xs text-slate-600">{r.userName}<span className="block text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span></td>
                  <td className="px-3 py-3"><span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-900"><Star className="h-3 w-3 fill-amber-500 text-amber-500" />{Number(r.rating).toFixed(1)}</span>{r.rating < 3 ? <span className="mt-1 block text-[9px] font-bold text-rose-500">Needs verification</span> : null}</td>
                  <td className="px-3 py-3"><p className="max-w-md text-xs leading-relaxed text-slate-600">{r.text}</p><p className="mt-1 text-[10px] text-slate-400">Helpful: {r.helpfulUp} 👍 / {r.helpfulDown} 👎</p></td>
                  <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase ${tone(r.status)}`}>{r.status}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      {r.status !== "approved" ? (
                        <button type="button" onClick={() => void setStatus(r, "approved")} title="Approve and publish" className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /></button>
                      ) : null}
                      {r.status !== "rejected" ? (
                        <button type="button" onClick={() => void setStatus(r, "rejected")} title="Reject" className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"><X className="h-3.5 w-3.5" /></button>
                      ) : null}
                      {r.status !== "pending" ? (
                        <button type="button" onClick={() => void setStatus(r, "pending")} title="Move back to pending" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"><Clock3 className="h-3.5 w-3.5" /></button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? <tr><td colSpan={6} className="px-3 py-10 text-center text-xs text-slate-400">No reviews match this filter.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

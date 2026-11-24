"use client";

/** Admin → Refund / Return: cancellations, returns and refund settlement. */

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Loader2, RefreshCw, RotateCcw, Wallet, XCircle } from "lucide-react";
import { inr } from "@/lib/site";

type RefundItem = { productId: number; name: string; quantity: number; unitPrice: number; color?: string; size?: string };
type Refund = {
  id: number;
  orderId: number;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  kind: "cancel" | "return";
  amount: number;
  paymentMethod: string;
  reason: string;
  status: "pending" | "refunded" | "rejected";
  items: RefundItem[];
  createdAt: string;
};

const tone = (s: string) =>
  s === "refunded" ? "bg-emerald-50 text-emerald-700"
    : s === "pending" ? "bg-amber-50 text-amber-700"
    : "bg-rose-50 text-rose-700";

export default function RefundManager() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/refunds", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load refunds");
      setRefunds(data.refunds ?? []);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load refunds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const selected = String(filter);
    return refunds.filter((r) => selected === "all" || r.status === selected);
  }, [refunds, filter]);

  const setStatus = async (refund: Refund, status: "refunded" | "rejected" | "pending") => {
    try {
      const res = await fetch(`/api/admin/refunds/${refund.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update refund");
      setRefunds((prev) => prev.map((r) => (r.id === refund.id ? { ...r, status } : r)));
      setNotice(status === "refunded" ? "Refund marked complete and customer notified." : "Refund updated.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update refund");
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading refunds…</div>;

  const pendingAmount = refunds.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Refund / Return</h2>
          <p className="mt-1 text-xs text-slate-500">
            Cancelled and returned orders, the customers involved, and refund settlement. Stock is
            restored automatically when a paid order is cancelled; COD orders are handled manually.
          </p>
          {notice ? <p className="mt-1 text-[11px] font-semibold text-orange-600">{notice}</p> : null}
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total cases", value: refunds.length, icon: RotateCcw, color: "bg-orange-50 text-orange-600" },
          { label: "Awaiting refund", value: refunds.filter((r) => r.status === "pending").length, icon: Clock3, color: "bg-amber-50 text-amber-600" },
          { label: "Refunded", value: refunds.filter((r) => r.status === "refunded").length, icon: Check, color: "bg-emerald-50 text-emerald-600" },
          { label: "Amount pending", value: inr(pendingAmount), icon: Wallet, color: "bg-violet-50 text-violet-600" },
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
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold">
            <option value="all">All cases</option>
            <option value="pending">Pending refund</option>
            <option value="refunded">Refunded</option>
            <option value="rejected">Rejected</option>
          </select>
          <p className="text-[11px] text-slate-400">Only paid orders create a refund case — COD has nothing to refund.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr><th className="px-3 py-3">Order / customer</th><th className="px-3 py-3">Items</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Reason</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="align-top hover:bg-slate-50/60">
                  <td className="px-3 py-3"><span className="block text-xs font-bold text-slate-800">{r.orderNo}</span><span className="block text-[11px] text-slate-600">{r.customerName}</span><span className="block text-[10px] text-slate-400">{r.customerEmail}</span><span className="block text-[10px] text-slate-400">{r.customerPhone}</span></td>
                  <td className="px-3 py-3"><span className="block max-w-[220px] text-[11px] text-slate-600">{r.items.map((i) => `${i.name} × ${i.quantity}${i.color ? ` (${i.color})` : ""}${i.size ? ` ${i.size}` : ""}`).join(", ")}</span></td>
                  <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{r.kind}</span></td>
                  <td className="px-3 py-3 text-xs font-bold text-slate-800">{inr(r.amount)}<span className="block text-[10px] font-normal text-slate-400">{r.paymentMethod}</span></td>
                  <td className="px-3 py-3 text-[11px] text-slate-500">{r.reason}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${tone(r.status)}`}>{r.status}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.status !== "refunded" ? <button type="button" onClick={() => void setStatus(r, "refunded")} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700">Mark refunded</button> : null}
                      {r.status !== "rejected" ? <button type="button" onClick={() => void setStatus(r, "rejected")} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50">Reject</button> : null}
                      {r.status !== "pending" ? <button type="button" onClick={() => void setStatus(r, "pending")} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-500">Pending</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? <tr><td colSpan={7} className="px-3 py-10 text-center text-xs text-slate-400">No refund or return cases yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        When an admin cancels a paid order from Order Details, the units return to stock and the case
        appears here automatically. Gmail notifications are sent when GMAIL_USER / GMAIL_APP_PASSWORD are configured.
      </p>
    </div>
  );
}

"use client";

/** Admin → Order Details: all orders, variants, fulfilment status and print labels. */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Package, Printer, RefreshCw, Search, Truck, Wallet, X } from "lucide-react";
import { inr } from "@/lib/site";

type OrderItem = {
  id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  color: string;
  size: string;
};

type Order = {
  id: number;
  order_no: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping: number;
  total: number;
  contact_name: string;
  contact_phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  created_at: string;
  customer: { name: string; email: string };
  items: OrderItem[];
};

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAGE = 10;

const statusTone = (status: string) =>
  status === "delivered" ? "bg-emerald-50 text-emerald-700"
    : status === "shipped" ? "bg-sky-50 text-sky-700"
    : status === "processing" ? "bg-violet-50 text-violet-700"
    : status === "cancelled" ? "bg-rose-50 text-rose-700"
    : "bg-amber-50 text-amber-700";

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Package; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value}</p></div>
        <span className={`rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></span>
      </div>
    </div>
  );
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);
  const [printing, setPrinting] = useState<Order | null>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load orders");
      setOrders(data.orders ?? []);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => orders.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (search) {
      const hay = `${o.order_no} ${o.customer.name} ${o.customer.email} ${o.contact_phone} ${o.items.map((i) => i.product_name).join(" ")}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [orders, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE, safePage * PAGE);

  const updateStatus = async (order: Order, next: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update status");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
      if (selected?.id === order.id) setSelected((prev) => (prev ? { ...prev, status: next } : prev));
      if (printing?.id === order.id) setPrinting((prev) => (prev ? { ...prev, status: next } : prev));
      setNotice("Order status updated.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update status");
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading orders…</div>;

  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Order Details</h2>
          <p className="mt-1 text-xs text-slate-500">Every order placed on the website, with items, quantity, colour, size, and printable dispatch labels.</p>
          {notice ? <p className="mt-1 text-[11px] font-semibold text-orange-600">{notice}</p> : null}
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={String(orders.length)} icon={Package} tone="bg-orange-50 text-orange-600" />
        <StatCard label="To process" value={String(orders.filter((o) => ["pending", "processing"].includes(o.status)).length)} icon={Truck} tone="bg-amber-50 text-amber-600" />
        <StatCard label="Shipped" value={String(orders.filter((o) => o.status === "shipped").length)} icon={Truck} tone="bg-sky-50 text-sky-600" />
        <StatCard label="Order value" value={inr(revenue)} icon={Wallet} tone="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search order no, customer, phone or product…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-orange-500" />
          </label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr><th className="px-3 py-3">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Items</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3"><span className="block text-xs font-bold text-slate-800">{o.order_no}</span><span className="block text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString("en-IN")}</span></td>
                  <td className="px-3 py-3"><span className="block text-xs font-semibold text-slate-700">{o.customer.name || o.contact_name || "—"}</span><span className="block text-[10px] text-slate-400">{o.contact_phone}</span></td>
                  <td className="px-3 py-3 text-xs text-slate-700">{o.items.reduce((n, i) => n + i.quantity, 0)} units<br /><span className="text-[10px] text-slate-400">{o.items.length} lines</span></td>
                  <td className="px-3 py-3 text-xs font-bold text-slate-800">{inr(o.total)}</td>
                  <td className="px-3 py-3"><span className="text-[11px] font-semibold text-slate-700">{o.payment_method || "—"}</span><span className={`block text-[10px] ${o.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{o.payment_status || "pending"}</span></td>
                  <td className="px-3 py-3">
                    <select value={o.status} onChange={(e) => void updateStatus(o, e.target.value)} className={`rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold ${statusTone(o.status)}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setSelected(o)} className="text-[11px] font-bold text-orange-600 hover:underline">View</button>
                      {o.status !== "cancelled" ? (
                        <button
                          type="button"
                          onClick={() => {
                            const reason = window.prompt("Reason for cancellation (optional):") ?? "Cancelled by admin";
                            void updateStatus(o, "cancelled", reason);
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          Cancel
                        </button>
                      ) : null}
                      <button type="button" onClick={() => setPrinting(o)} title="Print dispatch label" className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-orange-400 hover:text-orange-600"><Printer className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? <tr><td colSpan={7} className="px-3 py-10 text-center text-xs text-slate-400">No orders found.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-500">Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE + 1}–{Math.min(safePage * PAGE, filtered.length)} of {filtered.length} orders</p>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setPage(1)} disabled={safePage === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">First</button>
            <button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
            <span className="px-2 text-xs font-bold text-slate-600">{safePage} / {totalPages}</span>
            <button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Last</button>
          </div>
        </div>
      </div>

      {/* Order detail modal */}
      {selected ? (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)} role="dialog" aria-modal="true" aria-label="Order details">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><h3 className="text-lg font-black text-slate-900">Order {selected.order_no}</h3><p className="text-[11px] text-slate-400">Placed {new Date(selected.created_at).toLocaleString("en-IN")}</p></div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-full bg-slate-100 p-2 text-slate-500"><X className="h-4 w-4" /></button>
            </div>

            <div className="mb-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-2">
              <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer</p><p className="mt-1 font-bold text-slate-800">{selected.customer.name || selected.contact_name}</p><p className="text-slate-500">{selected.customer.email}</p><p className="text-slate-500">{selected.contact_phone}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Deliver to</p><p className="mt-1 font-semibold text-slate-700">{[selected.address_line, selected.city, selected.state, selected.pincode].filter(Boolean).join(", ")}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payment</p><p className="mt-1 font-semibold text-slate-700">{selected.payment_method} · {selected.payment_status}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fulfilment</p>
                <select value={selected.status} onChange={(e) => void updateStatus(selected, e.target.value)} className="mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400"><tr><th className="py-2">Product</th><th className="py-2">Colour</th><th className="py-2">Size</th><th className="py-2">Qty</th><th className="py-2">Price</th><th className="py-2">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {selected.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 font-semibold text-slate-800">{i.product_name}</td>
                    <td className="py-2">{i.color || "—"}</td>
                    <td className="py-2">{i.size || "—"}</td>
                    <td className="py-2">{i.quantity}</td>
                    <td className="py-2">{inr(i.unit_price)}</td>
                    <td className="py-2 font-bold">{inr(i.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-right text-xs">
              <p className="text-slate-500">Subtotal {inr(selected.subtotal)} · Shipping {inr(selected.shipping)}</p>
              <p className="text-base font-black text-slate-900">Total {inr(selected.total)}</p>
            </div>
            {selected.notes ? <p className="mt-2 text-[11px] text-slate-500">Note: {selected.notes}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Close</button>
              <button type="button" onClick={() => { setPrinting(selected); setSelected(null); }} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-700"><Printer className="h-4 w-4" /> Print shipping label</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Printable dispatch label */}
      {printing ? (
        <div className="fixed inset-0 z-[500] overflow-y-auto bg-slate-900/60 p-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-white">Dispatch label — {printing.order_no}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900"><Printer className="h-4 w-4" /> Print</button>
                <button type="button" onClick={() => setPrinting(null)} className="rounded-xl border border-white/40 px-4 py-2 text-xs font-bold text-white">Close</button>
              </div>
            </div>

            <div className="print-label rounded-xl bg-white p-6 text-slate-900">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div><p className="text-xl font-black tracking-tight">PANGO APPARELS</p><p className="text-[10px]">Dispatch label · {printing.order_no}</p></div>
                <div className="text-right"><p className="text-[10px] font-bold uppercase text-slate-500">Order date</p><p className="text-xs font-bold">{new Date(printing.created_at).toLocaleDateString("en-IN")}</p><p className="mt-1 text-[10px] font-bold uppercase text-slate-500">Payment</p><p className="text-xs font-bold">{printing.payment_method} · {printing.payment_status}</p></div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div><p className="text-[10px] font-black uppercase text-slate-500">Ship to</p><p className="mt-1 text-sm font-black">{printing.contact_name}</p><p>{printing.address_line}</p><p>{printing.city}, {printing.state} — {printing.pincode}</p><p className="mt-1 font-semibold">Ph: {printing.contact_phone}</p></div>
                <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-500">Order summary</p><p className="mt-1 text-sm font-black">{printing.items.reduce((n, i) => n + i.quantity, 0)} items</p><p className="font-semibold">Total: {inr(printing.total)}</p></div>
              </div>

              <table className="mt-5 w-full text-left text-[11px]">
                <thead className="border-b border-slate-400 text-[9px] font-black uppercase"><tr><th className="py-1.5">Product</th><th>Colour</th><th>Size</th><th>Qty</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {printing.items.map((i) => <tr key={i.id}><td className="py-2 font-semibold">{i.product_name}</td><td>{i.color || "—"}</td><td>{i.size || "—"}</td><td className="font-black">{i.quantity}</td></tr>)}
                </tbody>
              </table>

              <div className="mt-6 flex items-end justify-between border-t border-slate-300 pt-3">
                <div><p className="text-[10px] font-black uppercase text-slate-500">Packed by</p><p className="mt-4 w-40 border-b border-slate-400" /></div>
                <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-500">Dispatch status</p><p className="text-sm font-black uppercase">{printing.status}</p></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

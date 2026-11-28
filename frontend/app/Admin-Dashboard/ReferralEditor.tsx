"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";
import { DEFAULT_REFERRAL_CONFIG, type ReferralConfig } from "@/lib/referral-config";

export default function ReferralEditor() {
  const [config, setConfig] = useState<ReferralConfig>({ ...DEFAULT_REFERRAL_CONFIG });
  const [notice, setNotice] = useState("");
  const ref = useRef(config);
  ref.current = config;

  useEffect(() => {
    fetch("/api/referral-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ReferralConfig | null) => data && setConfig(data))
      .catch(() => setNotice("Could not load referral settings."));
  }, []);

  const patch = useCallback((next: ReferralConfig) => {
    setConfig(next);
    setNotice("Saving…");
  }, []);

  useEffect(() => {
    if (notice !== "Saving…") return;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/referral-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(ref.current),
        });
        if (!res.ok) throw new Error("save failed");
        setNotice("Saved — the discount is now live at checkout.");
      } catch {
        setNotice("Could not save — check the backend and try again.");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [notice, config]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-orange-600" aria-hidden />
        <div>
          <h3 className="text-base font-black text-slate-900">Referral Code</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Set one code and its discount percentage. Shoppers can enter it at checkout; the
            discount is recalculated on the server before payment.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-[10px] font-bold uppercase text-slate-500">
          Code
          <input
            value={config.code}
            onChange={(e) => patch({ ...config, code: e.target.value.toUpperCase() })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-orange-500"
          />
        </label>
        <label className="text-[10px] font-bold uppercase text-slate-500">
          Discount (%)
          <input
            type="number"
            min={0}
            max={100}
            value={config.percent}
            onChange={(e) => patch({ ...config, percent: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-500"
          />
        </label>
        <label className="text-[10px] font-bold uppercase text-slate-500">
          Label
          <input
            value={config.label}
            onChange={(e) => patch({ ...config, label: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-500"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-700">
        <input
          type="checkbox"
          checked={config.active}
          onChange={(e) => patch({ ...config, active: e.target.checked })}
          className="h-4 w-4 accent-orange-600"
        />
        Referral code active
      </label>

      {notice ? <p className="mt-3 text-[11px] text-slate-500">{notice}</p> : null}
    </section>
  );
}

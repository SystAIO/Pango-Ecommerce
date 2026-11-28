"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";

function VerifyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not verify your email");
        return;
      }
      router.push("/?verified=1");
    } catch {
      setError("Could not verify your email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-orange-600">
        <MailCheck className="h-6 w-6" aria-hidden />
        <span className="text-[11px] font-black uppercase tracking-[0.18em]">One last step</span>
      </div>
      <h1 className="mt-3 text-2xl font-black text-gray-900">Verify your email</h1>
      <p className="mt-2 text-sm text-gray-600">
        We sent a 6-digit code to <b>{email || "your email"}</b>. Enter it below to activate your
        account. This is only needed when creating an account — signing in never asks for a code.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-xs font-semibold uppercase text-gray-700">
          Verification code
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="123456"
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-2xl font-black tracking-[0.4em] outline-none focus:border-orange-500 focus:bg-white"
            required
          />
        </label>
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || otp.length !== 6}
          className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          {busy ? "Verifying…" : "Verify & continue"}
        </button>
      </form>
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-gray-600 hover:text-orange-600">
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg">
        <Suspense fallback={<p className="p-8 text-sm text-gray-500">Loading…</p>}>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}

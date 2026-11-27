"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "If that account exists, a reset link has been sent.");
    } catch {
      setMessage("Could not send the reset link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg">
        <div className="p-8">
          <h1 className="text-2xl font-black text-gray-900">Forgot password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your account email and we&apos;ll send you a link to set a new password.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:bg-white"
              />
            </label>
            {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-orange-600">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

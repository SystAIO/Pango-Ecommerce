"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not reset password");
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError("Could not reset password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900">Set a new password</h1>
      <p className="mt-2 text-sm text-gray-600">Choose a password of at least 8 characters.</p>
      {!token ? <p className="mt-4 text-sm font-semibold text-rose-600">This reset link is missing its token.</p> : null}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-gray-700">
          New password
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:bg-white" />
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          Confirm password
          <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:bg-white" />
        </label>
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        <button type="submit" disabled={busy || !token} className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60">
          {busy ? "Saving…" : "Set password"}
        </button>
      </form>
      <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-orange-600">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg">
        <Suspense fallback={<p className="p-8 text-sm text-gray-500">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({
  mode,
  redirectTo = "/dashboard",
}: {
  mode: "login" | "register";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-heading text-center text-3xl font-light">
        {mode === "login" ? "התחברות" : "הרשמה"}
      </h1>
      <p className="mt-2 text-center text-sm text-charcoal/60">MAVASH Events</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="אימייל"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה (8+ תווים)"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-charcoal py-3 text-cream disabled:opacity-60"
        >
          {loading ? "מעבד..." : mode === "login" ? "כניסה" : "יצירת חשבון"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal/60">
        {mode === "login" ? (
          <>
            אין חשבון?{" "}
            <Link href="/register" className="underline">
              הרשמה
            </Link>
          </>
        ) : (
          <>
            כבר רשומים?{" "}
            <Link href="/login" className="underline">
              התחברות
            </Link>
          </>
        )}
      </p>
      <Link href="/" className="mt-4 block text-center text-xs text-charcoal/40">
        ← חזרה לדף הבית
      </Link>
    </main>
  );
}

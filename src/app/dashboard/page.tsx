"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ownerListEvents } from "@/lib/events-api";
import type { EventRecord } from "@/types/events";

type AuthMode = "login" | "register";

export default function DashboardHomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventRecord[] | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email);
          return ownerListEvents().then((d) => setEvents(d.events));
        }
        setEvents(null);
      })
      .catch(() => setEvents(null));
  }, []);

  async function onAuth(e: React.FormEvent) {
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
      setUserEmail(email);
      const listed = await ownerListEvents();
      setEvents(listed.events);
      if (listed.events.length === 1) {
        router.push(`/dashboard/${listed.events[0].slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUserEmail(null);
    setEvents(null);
  }

  if (userEmail && events !== null) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-light">האירועים שלי</h1>
            <p className="mt-1 text-sm text-charcoal/60">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm text-charcoal/60 underline"
          >
            יציאה
          </button>
        </div>

        <Link
          href="/dashboard/new"
          className="mt-8 inline-flex rounded-full bg-charcoal px-6 py-3 text-cream"
        >
          + אירוע חדש
        </Link>

        {events.length === 0 ? (
          <p className="mt-10 text-charcoal/70">עדיין אין אירועים — צרו את הראשון.</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {events.map((ev) => (
              <li key={ev.eventId}>
                <Link
                  href={`/dashboard/${ev.slug}`}
                  className="block rounded-xl border border-charcoal/10 px-4 py-4 hover:border-gold"
                >
                  <span className="font-medium">{ev.name}</span>
                  <span className="mt-1 block text-sm text-charcoal/60">{ev.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-heading text-center text-3xl font-light">MAVASH Events</h1>
      <p className="mt-2 text-center text-sm text-charcoal/60">
        פלטפורמת אירועים — הרשמה והתחברות
      </p>

      <div className="mt-6 flex rounded-full bg-charcoal/5 p-1">
        <button
          type="button"
          className={`flex-1 rounded-full py-2 text-sm ${mode === "login" ? "bg-white shadow" : ""}`}
          onClick={() => setMode("login")}
        >
          התחברות
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full py-2 text-sm ${mode === "register" ? "bg-white shadow" : ""}`}
          onClick={() => setMode("register")}
        >
          הרשמה
        </button>
      </div>

      <form onSubmit={onAuth} className="mt-8 space-y-4">
        <input
          type="email"
          required
          className="w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="אימייל"
        />
        <input
          type="password"
          required
          minLength={8}
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
    </main>
  );
}

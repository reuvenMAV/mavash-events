"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ownerListEvents } from "@/lib/events-api";
import type { EventRecord } from "@/types/events";

export default function DashboardHomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventRecord[] | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          router.replace("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data?.user?.email) return;
        setUserEmail(data.user.email);
        return ownerListEvents();
      })
      .then((listed) => {
        if (listed) setEvents(listed.events);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "שגיאה"));
  }, [router]);

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  if (!userEmail || events === null) {
    return (
      <main className="flex min-h-screen items-center justify-center text-charcoal/50">
        טוען...
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-light">האירועים שלי</h1>
          <p className="mt-1 text-sm text-charcoal/60">{userEmail}</p>
        </div>
        <button type="button" onClick={onLogout} className="text-sm text-charcoal/60 underline">
          יציאה
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

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

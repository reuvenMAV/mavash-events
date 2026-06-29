"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ownerStats } from "@/lib/events-api";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { EventStats } from "@/types/events";

export default function DashboardOverviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/dashboard";
          return null;
        }
        return ownerStats(slug);
      })
      .then((d) => {
        if (d) setStats(d.stats);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "שגיאה"));
  }, [slug]);

  const cards = stats
    ? [
        { label: "מוזמנים", value: stats.guestsTotal },
        { label: "אישרו", value: stats.confirmed, color: "text-emerald-600" },
        { label: "לא מגיעים", value: stats.declined, color: "text-red-600" },
        { label: "ממתינים", value: stats.pending },
        { label: "סה״כ אורחים", value: stats.guestsAttending },
        { label: "ברכות", value: stats.blessingsCount },
        { label: "תמונות", value: stats.photosCount },
      ]
    : [];

  return (
    <DashboardLayout slug={slug} active="overview">
      <h2 className="font-heading text-2xl font-light">סקירה</h2>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!stats && !error && <p className="mt-4 text-charcoal/50">טוען...</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className={`text-2xl font-semibold ${c.color || ""}`}>{c.value}</p>
            <p className="text-sm text-charcoal/60">{c.label}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

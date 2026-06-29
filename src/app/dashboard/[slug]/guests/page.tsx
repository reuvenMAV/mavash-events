"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ownerGuests } from "@/lib/events-api";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { GuestRecord } from "@/types/events";

const STATUS_LABEL = { yes: "מגיע", no: "לא", pending: "ממתין" };

export default function DashboardGuestsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "pending">("all");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/dashboard";
          return null;
        }
        return ownerGuests(slug);
      })
      .then((d) => {
        if (d) setGuests(d.guests);
      });
  }, [slug]);

  const filtered = guests.filter((g) => {
    // SCALE: client-side filter over full guest list — OK for low/medium volume (Sheets as DB).
    // @see docs/BACKEND.md — migrate when guest counts grow into thousands+.
    if (filter !== "all" && g.status !== filter) return false;
    if (!q.trim()) return true;
    return g.name.includes(q.trim()) || (g.phone || "").includes(q.trim());
  });

  return (
    <DashboardLayout slug={slug} active="guests">
      <h2 className="font-heading text-2xl font-light">מוזמנים</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-xl border border-charcoal/15 px-4 py-2 text-sm"
          placeholder="חיפוש..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(["all", "yes", "no", "pending"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-2 text-sm ${
              filter === f ? "bg-charcoal text-cream" : "bg-white"
            }`}
          >
            {f === "all" ? "הכל" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-charcoal/60">
              <th className="p-3 text-start">שם</th>
              <th className="p-3 text-start">טלפון</th>
              <th className="p-3 text-start">סטטוס</th>
              <th className="p-3 text-start">אורחים</th>
              <th className="p-3 text-start">הערות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.guestId} className="border-b border-charcoal/5">
                <td className="p-3 font-medium">{g.name}</td>
                <td className="p-3" dir="ltr">
                  {g.phone || "—"}
                </td>
                <td className="p-3">{STATUS_LABEL[g.status] || g.status}</td>
                <td className="p-3">{g.guestsCount || "—"}</td>
                <td className="p-3 text-charcoal/60">{g.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-charcoal/50">אין רשומות</p>
        )}
      </div>
    </DashboardLayout>
  );
}

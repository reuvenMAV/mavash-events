"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ownerBlessings } from "@/lib/events-api";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { BlessingRecord } from "@/types/events";

export default function DashboardBlessingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blessings, setBlessings] = useState<BlessingRecord[]>([]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/dashboard";
          return null;
        }
        return ownerBlessings(slug);
      })
      .then((d) => {
        if (d) setBlessings(d.blessings);
      });
  }, [slug]);

  return (
    <DashboardLayout slug={slug} active="blessings">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-light">ברכות</h2>
        <span className="text-sm text-charcoal/50">{blessings.length} ברכות</span>
      </div>
      <div className="mt-6 space-y-3">
        {blessings.map((b) => (
          <article key={b.blessingId} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-medium">{b.guestName}</p>
            <p className="mt-2 whitespace-pre-wrap text-charcoal/80">{b.message}</p>
            <p className="mt-2 text-xs text-charcoal/40">
              {new Date(b.createdAt).toLocaleString("he-IL")}
            </p>
          </article>
        ))}
        {blessings.length === 0 && (
          <p className="text-center text-charcoal/50">עדיין אין ברכות</p>
        )}
      </div>
    </DashboardLayout>
  );
}

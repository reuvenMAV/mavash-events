"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, QrCode, Radio, RefreshCw, Users } from "lucide-react";
import {
  ownerBlessings,
  ownerCreateGuest,
  ownerGenerateMemoryBook,
  ownerGetMemoryBook,
  ownerGetRsvps,
  ownerListActivity,
  ownerListGuestsEngagement,
  ownerPhotos,
} from "@/lib/events-api";
import { EVENT_IMAGES } from "@/lib/event-images";
import { StepImage } from "@/components/StepImage";
import type {
  ActivityRow,
  BlessingRow,
  GuestEngagement,
  GuestEngagementRow,
  MemoryBook,
  PhotoRow,
  RsvpRow,
} from "@/types/mvp";

type Tab = "guests" | "feed" | "rsvps" | "blessings" | "photos" | "memory";

const ENGAGEMENT_LABEL: Record<GuestEngagement, string> = {
  not_opened: "לא נפתח",
  opened: "נפתח",
  rsvp: "אישר הגעה",
  completed: "הושלם",
};

const ACTION_LABEL: Record<string, string> = {
  opened: "פתיחת הזמנה",
  rsvp: "אישור הגעה",
  blessing: "ברכה",
  photo_upload: "תמונות",
  completed: "סיום זרימה",
  guest_created: "אורח חדש",
  event_created: "אירוע נוצר",
  memory_book_created: "ספר זיכרונות",
};

export function OwnerEventDashboard({ slug }: { slug: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("guests");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [guests, setGuests] = useState<GuestEngagementRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [blessings, setBlessings] = useState<BlessingRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [memoryBook, setMemoryBook] = useState<MemoryBook | null>(null);

  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [g, a, r, b, p, m] = await Promise.all([
        ownerListGuestsEngagement(slug),
        ownerListActivity(slug),
        ownerGetRsvps(slug),
        ownerBlessings(slug),
        ownerPhotos(slug),
        ownerGetMemoryBook(slug),
      ]);
      setGuests(g.guests || []);
      setActivity(a.activity || []);
      setRsvps(r.rsvps || []);
      setBlessings(
        (b.blessings || []).map((x) => ({
          blessingId: x.blessingId,
          guestId: "",
          guestName: x.guestName,
          message: x.message,
          createdAt: x.createdAt,
        }))
      );
      setPhotos(
        (p.photos || []).map((x) => ({
          photoId: x.photoId,
          guestId: "",
          fileName: x.fileName,
          driveFileId: x.driveFileId,
          driveUrl: x.driveUrl,
          createdAt: x.createdAt,
        }))
      );
      setMemoryBook(m.memoryBook);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" }).then((r) => {
      if (!r.ok) router.replace("/login");
      else loadData();
    });
  }, [loadData, router]);

  async function onCreateGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await ownerCreateGuest(slug, {
        name: newGuestName.trim(),
        email: newGuestEmail.trim() || undefined,
        phone: newGuestPhone.trim() || undefined,
      });
      setNewGuestName("");
      setNewGuestEmail("");
      setNewGuestPhone("");
      await loadData();
      setTab("guests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  async function onGenerateMemory() {
    setLoading(true);
    try {
      const book = await ownerGenerateMemoryBook(slug);
      setMemoryBook(book);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-charcoal/50">
            ← האירועים שלי
          </Link>
          <h1 className="font-heading text-2xl">{slug}</h1>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1 rounded-full border border-charcoal/15 px-4 py-2 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          רענון
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-charcoal/5 p-1">
        {(
          [
            ["guests", `אורחים (${guests.length})`, Users],
            ["feed", `פיד (${activity.length})`, Radio],
            ["rsvps", `RSVP (${rsvps.length})`, null],
            ["blessings", `ברכות (${blessings.length})`, null],
            ["photos", `תמונות (${photos.length})`, null],
            ["memory", "זיכרונות", BookOpen],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
              tab === id ? "bg-white shadow-sm" : "text-charcoal/60"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {tab === "guests" && (
        <div className="space-y-4">
          <StepImage src={EVENT_IMAGES.qr} alt="QR" />
          <form onSubmit={onCreateGuest} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-3 flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4" /> הוספת אורח + QR
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                required
                placeholder="שם מלא"
                className="rounded-xl border border-charcoal/15 px-3 py-2 text-sm"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
              />
              <input
                placeholder="אימייל"
                dir="ltr"
                className="rounded-xl border border-charcoal/15 px-3 py-2 text-sm"
                value={newGuestEmail}
                onChange={(e) => setNewGuestEmail(e.target.value)}
              />
              <input
                placeholder="טלפון"
                dir="ltr"
                className="rounded-xl border border-charcoal/15 px-3 py-2 text-sm"
                value={newGuestPhone}
                onChange={(e) => setNewGuestPhone(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-3 rounded-full bg-charcoal px-5 py-2 text-sm text-cream"
            >
              צור אורח + QR
            </button>
          </form>
          <GuestsTable guests={guests} />
        </div>
      )}

      {tab === "feed" && (
        <div className="space-y-2">
          <StepImage src={EVENT_IMAGES.timeline} alt="פיד" />
          {activity.length === 0 ? (
            <Empty text="אין פעילות" />
          ) : (
            activity.map((a) => (
              <div key={a.logId} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                <p className="text-sm">
                  <span className="font-medium">{a.guestName || "מערכת"}</span> ·{" "}
                  {ACTION_LABEL[a.actionType] || a.actionType}
                </p>
                <p className="text-xs text-charcoal/40">{fmt(a.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "rsvps" && <RsvpTable rsvps={rsvps} />}
      {tab === "blessings" && <BlessingsList items={blessings} />}
      {tab === "photos" && <PhotosList items={photos} />}
      {tab === "memory" && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <StepImage src={EVENT_IMAGES.memoryBook} alt="זיכרונות" />
          {memoryBook ? (
            <div className="space-y-2">
              <a href={memoryBook.pdfUrl} target="_blank" rel="noopener noreferrer" className="block rounded-full bg-charcoal py-3 text-center text-cream">
                הורדת PDF
              </a>
              <a href={memoryBook.docUrl} target="_blank" rel="noopener noreferrer" className="block rounded-full border py-3 text-center text-sm">
                Google Doc
              </a>
            </div>
          ) : (
            <button type="button" onClick={onGenerateMemory} disabled={loading} className="w-full rounded-full bg-charcoal py-3 text-cream">
              יצירת ספר זיכרונות
            </button>
          )}
        </div>
      )}
    </main>
  );
}

function GuestsTable({ guests }: { guests: GuestEngagementRow[] }) {
  if (!guests.length) return <Empty text="אין אורחים" />;
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-start text-charcoal/60">
            {["שם", "סטטוס", "פתיחות", "QR", "קישור"].map((h) => (
              <th key={h} className="px-3 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => (
            <tr key={g.guestId} className="border-b border-charcoal/5">
              <td className="px-3 py-3 font-medium">{g.name}</td>
              <td className="px-3 py-3">{ENGAGEMENT_LABEL[g.engagement] || g.engagement}</td>
              <td className="px-3 py-3">{g.openCount}</td>
              <td className="px-3 py-3">
                {g.qrUrl ? (
                  <a href={g.qrUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                    <QrCode className="inline h-4 w-4" />
                  </a>
                ) : "—"}
              </td>
              <td className="px-3 py-3">
                {g.inviteUrl ? (
                  <a href={g.inviteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600" dir="ltr">
                    פתיחה
                  </a>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RsvpTable({ rsvps }: { rsvps: RsvpRow[] }) {
  if (!rsvps.length) return <Empty text="אין RSVPs" />;
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <tbody>
          {rsvps.map((r) => (
            <tr key={r.rsvpId} className="border-b">
              <td className="px-4 py-3">{r.name}</td>
              <td className="px-4 py-3">{r.attending === "yes" ? "כן" : "לא"}</td>
              <td className="px-4 py-3">{r.guestsCount}</td>
              <td className="px-4 py-3 text-xs text-charcoal/40">{fmt(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlessingsList({ items }: { items: BlessingRow[] }) {
  if (!items.length) return <Empty text="אין ברכות" />;
  return (
    <div className="space-y-3">
      {items.map((b) => (
        <div key={b.blessingId} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="font-medium">{b.guestName}</p>
          <p className="mt-2 text-charcoal/80">{b.message}</p>
        </div>
      ))}
    </div>
  );
}

function PhotosList({ items }: { items: PhotoRow[] }) {
  if (!items.length) return <Empty text="אין תמונות" />;
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <a key={p.photoId} href={p.driveUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-white px-4 py-3 text-sm text-blue-600 shadow-sm" dir="ltr">
          {p.fileName}
        </a>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl bg-white p-8 text-center text-charcoal/50 shadow-sm">{text}</div>;
}

function fmt(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

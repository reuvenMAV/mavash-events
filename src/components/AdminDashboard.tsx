"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Lock,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  adminPing,
  createGuest,
  fetchActivity,
  fetchBlessings,
  fetchGuestsEngagement,
  fetchMemoryBook,
  fetchPhotos,
  fetchReminders,
  fetchRsvps,
  generateMemoryBook,
  setupReminders,
} from "@/services/api";
import { getAdminKey, setAdminKey, STORAGE_KEY } from "@/lib/admin-auth";
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

const DEFAULT_SLUG = "noam-bar-mitzvah";
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
  reminder_sent: "תזכורת",
  memory_book_created: "ספר זיכרונות",
};

export function AdminDashboard() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [slug, setSlug] = useState(DEFAULT_SLUG);
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

  useEffect(() => {
    const stored = getAdminKey();
    if (stored) {
      setKey(stored);
      setAuthed(true);
    }
  }, []);

  const loadData = useCallback(async () => {
    const adminKey = getAdminKey();
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      const [g, a, r, b, p, m] = await Promise.all([
        fetchGuestsEngagement(slug, adminKey),
        fetchActivity(slug, adminKey),
        fetchRsvps(slug, adminKey),
        fetchBlessings(slug, adminKey),
        fetchPhotos(slug, adminKey),
        fetchMemoryBook(slug, adminKey),
      ]);
      setGuests(g.guests || []);
      setActivity(a.activity || []);
      setRsvps(r.rsvps || []);
      setBlessings(b.blessings || []);
      setPhotos(p.photos || []);
      setMemoryBook(m.memoryBook);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminPing(key.trim());
      setAdminKey(key.trim());
      setAuthed(true);
    } catch {
      setError("סיסמה שגויה");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setKey("");
  }

  async function onCreateGuest(e: React.FormEvent) {
    e.preventDefault();
    const adminKey = getAdminKey();
    if (!adminKey || !newGuestName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await createGuest(slug, adminKey, {
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
    const adminKey = getAdminKey();
    if (!adminKey) return;
    setLoading(true);
    try {
      const book = await generateMemoryBook(slug, adminKey);
      setMemoryBook(book);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  async function onSetupReminders() {
    const adminKey = getAdminKey();
    if (!adminKey) return;
    setLoading(true);
    try {
      await setupReminders(adminKey);
      await fetchReminders(slug, adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal text-gold">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl">ניהול אירוע</h1>
          <p className="mt-2 text-sm text-charcoal/60">הזינו את מפתח הניהול</p>
          <form onSubmit={onLogin} className="mt-6 space-y-4">
            <input
              type="password"
              dir="ltr"
              className="w-full rounded-xl border border-charcoal/15 px-4 py-3 text-base"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="ADMIN_ACCESS_KEY"
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !key.trim()}
              className="w-full rounded-full bg-charcoal py-3 text-cream disabled:opacity-60"
            >
              {loading ? "בודק..." : "כניסה"}
            </button>
          </form>
          <Link href="/" className="mt-6 block text-center text-sm text-charcoal/50">
            ← חזרה
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">ניהול אירוע — Phase 2</h1>
          <p className="text-sm text-charcoal/60">אורחים · פיד חי · זיכרונות</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSetupReminders}
            disabled={loading}
            className="rounded-full border border-charcoal/15 px-4 py-2 text-sm"
          >
            הפעל תזכורות
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1 rounded-full border border-charcoal/15 px-4 py-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            רענון
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-charcoal/15 px-4 py-2 text-sm text-charcoal/70"
          >
            יציאה
          </button>
        </div>
      </div>

      <label className="mb-4 block">
        <span className="text-sm text-charcoal/60">slug אירוע</span>
        <input
          dir="ltr"
          className="mt-1 w-full max-w-xs rounded-xl border border-charcoal/15 px-4 py-2 text-sm"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </label>

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-charcoal/5 p-1">
        {(
          [
            ["guests", `אורחים (${guests.length})`, Users],
            ["feed", `פיד חי (${activity.length})`, Radio],
            ["rsvps", `RSVP (${rsvps.length})`, null],
            ["blessings", `ברכות (${blessings.length})`, null],
            ["photos", `תמונות (${photos.length})`, null],
            ["memory", "ספר זיכרונות", BookOpen],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition ${
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
          <StepImage src={EVENT_IMAGES.qr} alt="הזמנת QR" />
          <form
            onSubmit={onCreateGuest}
            className="rounded-xl bg-white p-4 shadow-sm"
          >
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
                placeholder="אימייל (תזכורות)"
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
              disabled={loading || !newGuestName.trim()}
              className="mt-3 rounded-full bg-charcoal px-5 py-2 text-sm text-cream disabled:opacity-60"
            >
              צור אורח + QR
            </button>
          </form>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 text-start text-charcoal/60">
                  {["שם", "סטטוס", "פתיחות", "תזכורות", "QR", "קישור"].map((h) => (
                    <th key={h} className="px-3 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-charcoal/40">
                      אין אורחים — הוסיפו אורח ראשון
                    </td>
                  </tr>
                ) : (
                  guests.map((g) => (
                    <tr key={g.guestId} className="border-b border-charcoal/5">
                      <td className="px-3 py-3 font-medium">{g.name}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={g.engagement} />
                      </td>
                      <td className="px-3 py-3 text-charcoal/60">{g.openCount}</td>
                      <td className="px-3 py-3 text-xs text-charcoal/50">
                        {g.reminders.length
                          ? g.reminders.map((r) => r.type).join(", ")
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {g.qrUrl ? (
                          <a
                            href={g.qrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600"
                          >
                            <QrCode className="h-4 w-4" />
                            הורדה
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {g.inviteUrl ? (
                          <a
                            href={g.inviteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600"
                            dir="ltr"
                          >
                            פתיחה
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "feed" && (
        <div className="space-y-2">
          <StepImage src={EVENT_IMAGES.timeline} alt="פיד פעילות" />
          {activity.length === 0 ? (
            <EmptyState text="אין פעילות עדיין" />
          ) : (
            activity.map((a) => (
              <div
                key={a.logId}
                className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-sm"
              >
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{a.guestName || "מערכת"}</span>
                    {" · "}
                    {ACTION_LABEL[a.actionType] || a.actionType}
                  </p>
                  <p className="text-xs text-charcoal/40">{formatDate(a.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "rsvps" && (
        <DataTable
          headers={["שם", "טלפון", "מגיע", "אורחים", "הערה", "תאריך"]}
          rows={rsvps.map((r) => [
            r.name,
            r.phone || "—",
            r.attending === "yes" ? "כן" : "לא",
            String(r.guestsCount),
            r.notes || "—",
            formatDate(r.createdAt),
          ])}
          empty="אין אישורי הגעה עדיין"
        />
      )}

      {tab === "blessings" && (
        <div className="space-y-3">
          {blessings.length === 0 ? (
            <EmptyState text="אין ברכות עדיין" />
          ) : (
            blessings.map((b) => (
              <div key={b.blessingId} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-medium">{b.guestName}</p>
                <p className="mt-2 whitespace-pre-wrap text-charcoal/80">{b.message}</p>
                <p className="mt-2 text-xs text-charcoal/40">{formatDate(b.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "photos" && (
        <div className="space-y-2">
          {photos.length === 0 ? (
            <EmptyState text="אין תמונות עדיין" />
          ) : (
            photos.map((p) => (
              <a
                key={p.photoId}
                href={p.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm transition hover:bg-charcoal/5"
                dir="ltr"
              >
                <span className="truncate text-sm text-blue-600">{p.fileName}</span>
                <span className="text-xs text-charcoal/40">{formatDate(p.createdAt)}</span>
              </a>
            ))
          )}
        </div>
      )}

      {tab === "memory" && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <StepImage src={EVENT_IMAGES.memoryBook} alt="ספר זיכרונות" />
          <h2 className="font-heading text-xl">ספר זיכרונות</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            נוצר אוטומטית אחרי תאריך האירוע, או ידנית מכאן.
          </p>
          {memoryBook ? (
            <div className="mt-4 space-y-2">
              <a
                href={memoryBook.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-full bg-charcoal py-3 text-center text-cream"
              >
                הורדת PDF
              </a>
              <a
                href={memoryBook.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-full border border-charcoal/15 py-3 text-center text-sm"
              >
                פתיחת Google Doc
              </a>
              {memoryBook.createdAt && (
                <p className="text-center text-xs text-charcoal/40">
                  נוצר {formatDate(memoryBook.createdAt)}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onGenerateMemory}
              disabled={loading}
              className="mt-4 w-full rounded-full bg-charcoal py-3 text-cream disabled:opacity-60"
            >
              {loading ? "יוצר..." : "יצירת ספר זיכרונות"}
            </button>
          )}
        </div>
      )}

      <Link href="/" className="mt-8 block text-center text-sm text-charcoal/50">
        ← חזרה לדף הבית
      </Link>
    </main>
  );
}

function StatusBadge({ status }: { status: GuestEngagement }) {
  const colors: Record<GuestEngagement, string> = {
    not_opened: "bg-charcoal/10 text-charcoal/60",
    opened: "bg-blue-50 text-blue-700",
    rsvp: "bg-emerald-50 text-emerald-700",
    completed: "bg-gold/20 text-charcoal",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors[status]}`}>
      {ENGAGEMENT_LABEL[status] || status}
    </span>
  );
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (!rows.length) return <EmptyState text={empty} />;
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-charcoal/10 text-start text-charcoal/60">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-charcoal/5 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-white p-8 text-center text-charcoal/50 shadow-sm">{text}</div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("he-IL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

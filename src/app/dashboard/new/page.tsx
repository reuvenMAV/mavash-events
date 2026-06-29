"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ownerCreateEvent } from "@/lib/events-api";

const EVENT_TYPES = [
  { value: "bar_mitzvah", label: "בר מצווה" },
  { value: "bat_mitzvah", label: "בת מצווה" },
  { value: "wedding", label: "חתונה" },
  { value: "brit", label: "ברית" },
  { value: "birthday", label: "יום הולדת" },
  { value: "other", label: "אחר" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("bar_mitzvah");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [tagline, setTagline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ slug: string; publicToken: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await ownerCreateEvent({
        name,
        type,
        date,
        venue,
        tagline,
      });
      setCreated({ slug: result.slug, publicToken: result.publicToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    const guestUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/e/${created.slug}?t=${created.publicToken}`;
    return (
      <main className="mx-auto min-h-screen max-w-lg px-6 py-12">
        <h1 className="font-heading text-3xl font-light">האירוע נוצר!</h1>
        <p className="mt-4 text-charcoal/80">שלחו למוזמנים את הקישור:</p>
        <code className="mt-4 block break-all rounded-xl bg-charcoal/5 p-4 text-sm">{guestUrl}</code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(guestUrl)}
          className="mt-4 text-sm underline"
        >
          העתקה
        </button>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/${created.slug}`)}
          className="mt-8 block w-full rounded-full bg-charcoal py-3 text-cream"
        >
          מעבר לדשבורד האירוע
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-12">
      <h1 className="font-heading text-3xl font-light">אירוע חדש</h1>
      <p className="mt-2 text-sm text-charcoal/60">מילוי קצר — הלינק למוזמנים ייווצר אוטומטית</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          required
          className="w-full rounded-xl border border-charcoal/15 px-4 py-3"
          placeholder="שם האירוע"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="w-full rounded-xl border border-charcoal/15 px-4 py-3"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="w-full rounded-xl border border-charcoal/15 px-4 py-3"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-charcoal/15 px-4 py-3"
          placeholder="מיקום"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-charcoal/15 px-4 py-3"
          placeholder="משפט לדף הבית (אופציונלי)"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-charcoal py-3 text-cream disabled:opacity-60"
        >
          {loading ? "יוצר..." : "יצירת אירוע"}
        </button>
      </form>
    </main>
  );
}

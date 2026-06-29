"use client";

import { useState } from "react";
import { submitRsvp } from "@/lib/events-api";

export function RsvpForm({ slug, accessToken }: { slug: string; accessToken: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"yes" | "no" | "">("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !status) {
      setError("נא למלא שם ולבחור אם מגיעים");
      return;
    }
    setLoading(true);
    try {
      await submitRsvp(
        {
          slug,
          name: name.trim(),
          phone: phone.trim() || undefined,
          status,
          guestsCount: status === "yes" ? guestsCount : 0,
          notes: notes.trim() || undefined,
        },
        accessToken
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-4 font-heading text-2xl">תודה, {name}!</h2>
        <p className="mt-2 text-charcoal/70">
          {status === "yes"
            ? "שמחנו לקבל את אישור ההגעה. נתראה באירוע!"
            : "תודה שעדכנתם אותנו. נתראה בפעם אחרת!"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl">אישור הגעה</h2>

      <label className="block">
        <span className="text-sm text-charcoal/60">שם מלא *</span>
        <input
          className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ישראל ישראלי"
        />
      </label>

      <label className="block">
        <span className="text-sm text-charcoal/60">טלפון (לתזכורת)</span>
        <input
          type="tel"
          className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050-0000000"
          dir="ltr"
        />
      </label>

      <div>
        <span className="text-sm text-charcoal/60">האם תגיעו? *</span>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus("yes")}
            className={`rounded-xl border-2 py-3 font-medium transition ${
              status === "yes" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-charcoal/10"
            }`}
          >
            כן, נגיע ✓
          </button>
          <button
            type="button"
            onClick={() => setStatus("no")}
            className={`rounded-xl border-2 py-3 font-medium transition ${
              status === "no" ? "border-red-400 bg-red-50 text-red-800" : "border-charcoal/10"
            }`}
          >
            לא נוכל להגיע
          </button>
        </div>
      </div>

      {status === "yes" && (
        <label className="block">
          <span className="text-sm text-charcoal/60">כמה אורחים (כולל אתכם)?</span>
          <input
            type="number"
            min={1}
            max={20}
            className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
            value={guestsCount}
            onChange={(e) => setGuestsCount(parseInt(e.target.value, 10) || 1)}
          />
        </label>
      )}

      <label className="block">
        <span className="text-sm text-charcoal/60">הערות (אלרגיות, כיסא לתינוק...)</span>
        <textarea
          className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-charcoal py-3 font-medium text-cream disabled:opacity-60"
      >
        {loading ? "שולח..." : "שליחת אישור"}
      </button>
    </form>
  );
}

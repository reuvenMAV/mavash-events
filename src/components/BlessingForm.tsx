"use client";

import { useState } from "react";
import { submitBlessing } from "@/lib/events-api";

export function BlessingForm({ slug, accessToken }: { slug: string; accessToken: string }) {
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!guestName.trim() || !message.trim()) {
      setError("נא למלא שם וברכה");
      return;
    }
    setLoading(true);
    try {
      await submitBlessing(
        { slug, guestName: guestName.trim(), message: message.trim() },
        accessToken
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">💌</p>
        <h2 className="mt-4 font-heading text-2xl">תודה על הברכה!</h2>
        <p className="mt-2 text-charcoal/70">המילים החמות שלכם הגיעו למשפחה.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl">ספר ברכות</h2>
      <p className="text-sm text-charcoal/60">כתבו ברכה חמה — תופיע אצל המשפחה בדשבורד.</p>

      <label className="block">
        <span className="text-sm text-charcoal/60">השם שלכם *</span>
        <input
          className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm text-charcoal/60">הברכה *</span>
        <textarea
          className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="מזל טוב! מאחלים לך..."
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-charcoal py-3 font-medium text-cream disabled:opacity-60"
      >
        {loading ? "שולח..." : "שליחת ברכה"}
      </button>
    </form>
  );
}

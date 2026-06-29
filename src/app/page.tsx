import Link from "next/link";
import { CalendarHeart, Sparkles, AlertCircle } from "lucide-react";
import { hasGasBackend } from "@/lib/gas-server";

const DEMO_SLUG = "noam-bar-mitzvah";
const demoToken = process.env.NEXT_PUBLIC_DEMO_EVENT_TOKEN?.trim();

export default function HomePage() {
  const gasReady = hasGasBackend();
  const demoHref = demoToken
    ? `/e/${DEMO_SLUG}?t=${encodeURIComponent(demoToken)}`
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-charcoal text-gold">
        <CalendarHeart className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-4xl font-light">MAVASH Events</h1>
      <p className="mt-4 text-charcoal/70">
        אישורי הגעה · ספר ברכות · שיתוף תמונות — הכול על Google, בלי שרת.
      </p>

      {!gasReady && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-start text-sm text-amber-950">
          <p className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            האתר עלה — חיבור Google עדיין לא הוגדר
          </p>
          <p className="mt-2 text-amber-900/80">
            הוסף <code dir="ltr">GAS_WEB_APP_URL</code> ב-Vercel ופרוס את Apps Script. ראה{" "}
            <code>docs/SETUP.md</code>.
          </p>
        </div>
      )}

      <div className="mt-10 space-y-3">
        {demoHref ? (
          <Link
            href={demoHref}
            className="block rounded-full bg-charcoal px-6 py-3 text-cream transition hover:opacity-90"
          >
            דוגמה: בר מצווה של נועם
          </Link>
        ) : (
          <div className="rounded-2xl border border-charcoal/10 bg-white p-4 text-sm text-charcoal/70">
            <p className="font-medium text-charcoal">קישור אורח לדוגמה</p>
            <p className="mt-2" dir="ltr">
              /e/{DEMO_SLUG}?t=YOUR_PUBLIC_TOKEN
            </p>
            <p className="mt-2 text-xs">
              הטוקן נוצר ב-Apps Script אחרי <code>setupWorkbook_</code> (Execution log).
              אופציונלי: <code>NEXT_PUBLIC_DEMO_EVENT_TOKEN</code> ב-Vercel לכפתור ישיר.
            </p>
          </div>
        )}
        <Link
          href="/dashboard"
          className="block rounded-full border border-charcoal/20 px-6 py-3 text-charcoal transition hover:bg-white"
        >
          כניסת מנהלים
        </Link>
      </div>
      <p className="mt-12 flex items-center justify-center gap-2 text-xs text-charcoal/50">
        <Sparkles className="h-3.5 w-3.5" />
        <a href="https://mavash-events.vercel.app" className="underline" dir="ltr">
          mavash-events.vercel.app
        </a>
      </p>
    </main>
  );
}

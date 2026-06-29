import Link from "next/link";
import Image from "next/image";
import { FolderPlus, Sparkles, AlertCircle } from "lucide-react";
import { hasGasBackend } from "@/lib/gas-server";
import { EVENT_IMAGES } from "@/lib/event-images";

const DEMO_SLUG = "noam-bar-mitzvah";
const demoToken = process.env.NEXT_PUBLIC_DEMO_EVENT_TOKEN?.trim();

const EVENT_TYPES = [
  { emoji: "🎉", label: "בר מצווה" },
  { emoji: "💍", label: "חתונה" },
  { emoji: "🎂", label: "יום הולדת" },
  { emoji: "👶", label: "ברית" },
  { emoji: "🏢", label: "כנסים" },
  { emoji: "🏖️", label: "ימי גיבוש" },
  { emoji: "🎓", label: "סיום לימודים" },
];

const FEATURES = [
  { image: EVENT_IMAGES.qr, title: "הזמנה אישית + QR", desc: "קישור ייחודי לכל אורח" },
  { image: EVENT_IMAGES.rsvp, title: "אישור הגעה", desc: "טופס מהיר ונעים במובייל" },
  { image: EVENT_IMAGES.blessings, title: "ספר ברכות", desc: "מילים חמות מהמשפחה והחברים" },
  { image: EVENT_IMAGES.photos, title: "שיתוף תמונות", desc: "גלריה משותפת מהאירוע" },
  { image: EVENT_IMAGES.timeline, title: "פיד חי", desc: "מעקב פעילות בזמן אמת" },
  { image: EVENT_IMAGES.memoryBook, title: "ספר זיכרונות", desc: "PDF מעוצב אחרי האירוע" },
];

export default function HomePage() {
  const gasReady = hasGasBackend();
  const demoHref = demoToken
    ? `/e/${DEMO_SLUG}?t=${encodeURIComponent(demoToken)}`
    : null;

  return (
    <main className="min-h-screen bg-[#faf8f5]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[50vh] min-h-[300px] max-h-[460px]">
          <Image
            src={EVENT_IMAGES.hero}
            alt="הזמנה לאירוע חגיגי"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/45 to-charcoal/25" />
          <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-10 text-center text-white">
            <h1 className="font-heading text-4xl font-light tracking-tight sm:text-5xl">
              MAVASH Events
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm opacity-90 sm:text-base">
              פלטפורמה אחת לכל סוגי האירועים — הזמנות, אישורי הגעה, ברכות, תמונות וספר
              זיכרונות
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-medium text-charcoal transition hover:opacity-90"
              >
                <FolderPlus className="h-4 w-4" />
                פתיחת אירוע חדש
              </Link>
              {demoHref ? (
                <Link
                  href={demoHref}
                  className="rounded-full border border-white/40 px-8 py-3 text-sm transition hover:bg-white/10"
                >
                  דוגמה חיה
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {!gasReady && (
        <div className="mx-auto max-w-lg px-6 pt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-start text-sm text-amber-950">
            <p className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              האתר עלה — חיבור Google עדיין לא הוגדר
            </p>
            <p className="mt-2 text-amber-900/80">
              הוסף <code dir="ltr">GAS_WEB_APP_URL</code> ב-Vercel. ראה <code>docs/SETUP.md</code>.
            </p>
          </div>
        </div>
      )}

      {/* Event types */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-center font-heading text-2xl font-light text-charcoal">
          מתאים לכל סוג אירוע
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-charcoal/60">
          כל אירוע הוא פרויקט עצמאי במערכת — עם אורחים, QR, וזרימה משלו
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {EVENT_TYPES.map((type) => (
            <li
              key={type.label}
              className="flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-4 py-2.5 text-sm shadow-sm"
            >
              <span className="text-lg leading-none" aria-hidden>
                {type.emoji}
              </span>
              <span className="text-charcoal">{type.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="border-y border-charcoal/10 bg-white py-12">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="text-3xl">📁</p>
          <h2 className="mt-3 font-heading text-xl text-charcoal">פרויקט חדש = אירוע חדש</h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
            נכנסים לניהול, יוצרים אורחים ומקבלים QR לכל אחד. האורחים עוברים זרימה אחת רציפה:
            אישור הגעה → ברכה → תמונות. אתם רואים הכול בדשבורד — פיד חי, תזכורות וספר זיכרונות.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-block rounded-full bg-charcoal px-6 py-2.5 text-sm text-cream transition hover:opacity-90"
          >
            כניסה לניהול
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-center font-heading text-2xl font-light text-charcoal">
          הכול בפלטפורמה אחת
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-charcoal/60">
          מפתיחת ההזמנה ועד ספר הזיכרונות — זרימה רציפה ואישית לכל אורח
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-40">
                <Image src={f.image} alt={f.title} fill className="object-cover object-top" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-charcoal">{f.title}</h3>
                <p className="mt-1 text-sm text-charcoal/60">{f.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-charcoal/10 py-8 text-center">
        <p className="font-heading text-sm text-charcoal/70">MAVASH Events</p>
        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-charcoal/50">
          <Sparkles className="h-3.5 w-3.5" />
          <a href="https://mavash-events.vercel.app" className="underline" dir="ltr">
            mavash-events.vercel.app
          </a>
        </p>
      </footer>
    </main>
  );
}

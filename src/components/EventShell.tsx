import Link from "next/link";
import type { EventRecord } from "@/types/events";

const EVENT_TYPE_LABEL: Record<string, string> = {
  bar_mitzvah: "בר מצווה",
  bat_mitzvah: "בת מצווה",
  wedding: "חתונה",
  birthday: "יום הולדת",
  brit: "ברית",
  corporate: "אירוע חברה",
  other: "אירוע",
};

function tokenQuery(accessToken: string) {
  return `?t=${encodeURIComponent(accessToken)}`;
}

export function EventShell({
  event,
  accessToken,
  children,
}: {
  event: EventRecord;
  accessToken: string;
  children: React.ReactNode;
}) {
  const primary = event.theme?.primary || "#1e3a5f";
  const accent = event.theme?.accent || "#c9a227";
  const q = tokenQuery(accessToken);
  const base = `/e/${event.slug}`;

  return (
    <div className="min-h-screen" style={{ background: event.theme?.background || "#faf8f5" }}>
      <header
        className="px-6 py-10 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}
      >
        <p className="text-sm opacity-80">{EVENT_TYPE_LABEL[event.type] || event.type}</p>
        <h1 className="mt-2 font-heading text-3xl font-light sm:text-4xl">{event.name}</h1>
        {event.tagline && <p className="mx-auto mt-3 max-w-md text-sm opacity-90">{event.tagline}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs opacity-90">
          {event.date && <span>📅 {formatHeDate(event.date)}</span>}
          {event.venue && <span>📍 {event.venue}</span>}
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-charcoal/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg justify-center gap-1 px-4 py-2">
          <NavTab href={`${base}${q}`} label="בית" />
          <NavTab href={`${base}/rsvp${q}`} label="אישור הגעה" accent={accent} />
          <NavTab href={`${base}/blessings${q}`} label="ברכה" />
          <NavTab href={`${base}/photos${q}`} label="תמונות" />
        </div>
      </nav>

      <div className="mx-auto max-w-lg px-4 py-8">{children}</div>
    </div>
  );
}

function NavTab({ href, label, accent }: { href: string; label: string; accent?: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 text-sm text-charcoal/80 transition hover:bg-charcoal/5"
      style={accent ? { color: accent } : undefined}
    >
      {label}
    </Link>
  );
}

function formatHeDate(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

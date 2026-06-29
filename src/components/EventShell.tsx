import Image from "next/image";
import type { EventRecord } from "@/types/events";
import { EVENT_IMAGES } from "@/lib/event-images";

const EVENT_TYPE_LABEL: Record<string, string> = {
  bar_mitzvah: "בר מצווה",
  bat_mitzvah: "בת מצווה",
  wedding: "חתונה",
  birthday: "יום הולדת",
  brit: "ברית",
  corporate: "אירוע חברה",
  other: "אירוע",
};

export function EventShell({
  event,
  children,
}: {
  event: EventRecord;
  accessToken?: string;
  children: React.ReactNode;
}) {
  const primary = event.theme?.primary || "#1e3a5f";

  return (
    <div className="min-h-screen" style={{ background: event.theme?.background || "#faf8f5" }}>
      <header className="relative overflow-hidden text-center text-white">
        <div className="absolute inset-0">
          <Image
            src={EVENT_IMAGES.hero}
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primary}ee, ${primary}cc)`,
            }}
          />
        </div>
        <div className="relative px-6 py-10">
        <p className="text-sm opacity-80">{EVENT_TYPE_LABEL[event.type] || event.type}</p>
        <h1 className="mt-2 font-heading text-3xl font-light sm:text-4xl">{event.name}</h1>
        {event.tagline && (
          <p className="mx-auto mt-3 max-w-md text-sm opacity-90">{event.tagline}</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs opacity-90">
          {event.date && <span>📅 {formatHeDate(event.date)}</span>}
          {event.venue && <span>📍 {event.venue}</span>}
        </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6">{children}</div>
    </div>
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

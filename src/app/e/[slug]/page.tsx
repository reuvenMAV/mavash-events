export const dynamic = "force-dynamic";

import { EventFlow } from "@/components/EventFlow";
import { EventShell } from "@/components/EventShell";
import { InvalidAccessToken, MissingAccessToken } from "@/components/EventAccessMessage";
import { loadEventForGuest } from "@/lib/load-event";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string; guest?: string }>;
}) {
  const { slug } = await params;
  const { t, guest } = await searchParams;

  if (guest) {
    const { redirect } = await import("next/navigation");
    const loaded = await loadEventForGuest(slug, t);
    if (loaded.ok) {
      redirect(`/event/${loaded.event.eventId}?guest=${encodeURIComponent(guest)}`);
    }
  }

  const loaded = await loadEventForGuest(slug, t);

  if (!loaded.ok) {
    if (loaded.reason === "missing_token") return <MissingAccessToken slug={slug} />;
    return <InvalidAccessToken />;
  }

  const { event } = loaded;

  return (
    <EventShell event={event}>
      <EventFlow
        event={{
          eventId: event.eventId,
          slug: event.slug,
          name: event.name,
          type: event.type,
          date: event.date,
          venue: event.venue,
          tagline: event.tagline || "",
          theme: event.theme,
        }}
        ctx={{ mode: "token", slug, accessToken: t! }}
      />
    </EventShell>
  );
}

export const dynamic = "force-dynamic";

import { EventFlow } from "@/components/EventFlow";
import { EventShell } from "@/components/EventShell";
import { loadEventForGuestInvite } from "@/lib/load-guest-event";
import Link from "next/link";

export default async function GuestInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ guest?: string }>;
}) {
  const { eventId } = await params;
  const { guest } = await searchParams;
  const loaded = await loadEventForGuestInvite(eventId, guest);

  if (!loaded.ok) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="text-4xl">🔗</p>
          <h1 className="mt-4 font-heading text-2xl">קישור לא תקין</h1>
          <p className="mt-2 text-charcoal/60">
            {loaded.reason === "missing_guest"
              ? "חסר מזהה אורח בקישור"
              : "לא נמצא אירוע או אורח"}
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-charcoal/50 underline">
            חזרה לדף הבית
          </Link>
        </div>
      </main>
    );
  }

  const { event, guest: guestInfo, hasRsvp, rsvp } = loaded;

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
        ctx={{ mode: "guest", eventId: event.eventId, guestId: guestInfo.guestId }}
        initialName={guestInfo.name}
        initialPhone={guestInfo.phone}
        hasRsvp={hasRsvp}
        initialAttending={
          rsvp?.attending === "yes" || rsvp?.attending === "no"
            ? rsvp.attending
            : undefined
        }
      />
    </EventShell>
  );
}

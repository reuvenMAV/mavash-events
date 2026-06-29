import { getEventsBackend } from "@/lib/backend";
import type { EventRecord } from "@/types/events";

export type LoadGuestEventResult =
  | {
      ok: true;
      event: EventRecord;
      guest: { guestId: string; name: string; phone: string; engagement: string };
      hasRsvp: boolean;
      rsvp: { attending: string; guestsCount: number } | null;
    }
  | { ok: false; reason: "missing_guest" | "not_found" };

export async function loadEventForGuestInvite(
  eventId: string,
  guestId?: string | null
): Promise<LoadGuestEventResult> {
  const gid = (guestId || "").trim();
  const eid = (eventId || "").trim();
  if (!gid || !eid) return { ok: false, reason: "missing_guest" };

  try {
    const backend = getEventsBackend();
    const data = await backend.getEventForGuest(eid, gid);
    return {
      ok: true,
      event: data.event,
      guest: data.guest,
      hasRsvp: data.hasRsvp,
      rsvp: data.rsvp,
    };
  } catch {
    return { ok: false, reason: "not_found" };
  }
}

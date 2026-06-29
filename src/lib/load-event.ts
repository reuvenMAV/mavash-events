import { getEventsBackend } from "@/lib/backend";
import type { EventRecord } from "@/types/events";

export type LoadEventResult =
  | { ok: true; event: EventRecord }
  | { ok: false; reason: "missing_token" | "invalid_token" | "not_found" };

/** Server-side event load — requires invite token (?t=). */
export async function loadEventForGuest(
  slug: string,
  accessToken?: string | null
): Promise<LoadEventResult> {
  const token = (accessToken || "").trim();
  if (!token) return { ok: false, reason: "missing_token" };

  try {
    const backend = getEventsBackend();
    const { event } = await backend.getEvent(slug, { accessToken: token });
    if (!event) return { ok: false, reason: "not_found" };
    return { ok: true, event };
  } catch {
    return { ok: false, reason: "invalid_token" };
  }
}

/**
 * HERMES / n8n event bus — fire-and-forget from /api/events.
 * Do not block user-facing responses on webhook delivery.
 *
 * @see docs/INTEGRATIONS.md
 */
export type HermesEventType =
  | "rsvp.submitted"
  | "blessing.added"
  | "photos.uploaded"
  | "event.created";

export type HermesEvent = {
  source: "mavash-events";
  version: 1;
  type: HermesEventType;
  timestamp: string;
  slug: string;
  data: Record<string, unknown>;
};

function webhookUrl(): string | null {
  const url = process.env.N8N_EVENTS_WEBHOOK_URL?.trim();
  return url || null;
}

function webhookKey(): string {
  return process.env.N8N_EVENTS_WEBHOOK_KEY?.trim() || "";
}

/** Non-blocking — logs on failure in dev only */
export function emitHermesEvent(
  type: HermesEventType,
  slug: string,
  data: Record<string, unknown>
): void {
  const url = webhookUrl();
  if (!url) return;

  const payload: HermesEvent = {
    source: "mavash-events",
    version: 1,
    type,
    timestamp: new Date().toISOString(),
    slug,
    data,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = webhookKey();
  if (key) headers["x-hermes-key"] = key;

  fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  }).catch((err) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[hermes] webhook failed:", err);
    }
  });
}

export function hermesConfigured(): boolean {
  return Boolean(webhookUrl());
}

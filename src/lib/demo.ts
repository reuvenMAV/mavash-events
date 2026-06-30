export const DEMO_SLUG = "noam-bar-mitzvah";
export const DEMO_EVENT_NAME = "בר מצווה של אבנר";

/** Server-side demo token (prefer DEMO_EVENT_TOKEN; falls back to NEXT_PUBLIC). */
export function getDemoEventToken(): string {
  return (
    process.env.DEMO_EVENT_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_DEMO_EVENT_TOKEN?.trim() ||
    ""
  );
}

export function getDemoHref(): string | null {
  const token = getDemoEventToken();
  if (!token) return null;
  return `/e/${DEMO_SLUG}?t=${encodeURIComponent(token)}`;
}

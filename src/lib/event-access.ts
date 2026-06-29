const STORAGE_PREFIX = "mavash-event-token:";

export function storeEventToken(slug: string, token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_PREFIX + slug, token);
}

export function getStoredEventToken(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_PREFIX + slug);
}

export function resolveAccessToken(slug: string, fromUrl?: string | null): string | null {
  const t = (fromUrl || "").trim();
  if (t) {
    storeEventToken(slug, t);
    return t;
  }
  return getStoredEventToken(slug);
}

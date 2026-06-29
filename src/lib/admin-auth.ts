export const STORAGE_KEY = "mavash-events-admin-key";

export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAdminKey(key: string) {
  sessionStorage.setItem(STORAGE_KEY, key);
}

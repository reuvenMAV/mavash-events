import type {
  BlessingPayload,
  BlessingRecord,
  EventRecord,
  EventStats,
  GuestRecord,
  PhotoRecord,
  RsvpPayload,
} from "@/types/events";
import { compressImagesForUpload } from "@/lib/image-compress";
import { UPLOAD_LIMITS } from "@/lib/upload-limits";

/**
 * Client API — always goes through /api/events (never GAS directly).
 * Backend is swappable via EventsBackend interface (@see docs/BACKEND.md).
 */

async function api<T>(
  body: Record<string, unknown>,
  accessToken: string
): Promise<T> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, accessToken }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "שגיאה");
  }
  return data as T;
}

async function apiAdmin<T>(body: Record<string, unknown>, adminKey: string): Promise<T> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "שגיאה");
  }
  return data as T;
}

export async function fetchEvent(slug: string, accessToken: string) {
  return api<{ event: EventRecord }>({ action: "getEvent", slug }, accessToken);
}

export async function submitRsvp(payload: RsvpPayload, accessToken: string) {
  return api<{ success: boolean; guestId: string }>(
    { action: "submitRsvp", ...payload },
    accessToken
  );
}

export async function submitBlessing(payload: BlessingPayload, accessToken: string) {
  return api<{ success: boolean; blessingId: string }>(
    { action: "addBlessing", ...payload },
    accessToken
  );
}

export async function uploadPhotos(
  slug: string,
  files: File[],
  accessToken: string,
  uploadedBy?: string,
  onProgress?: (done: number, total: number) => void
) {
  const compressed = await compressImagesForUpload(files);
  const ready = compressed.map((c) => c.file);

  const batchSize = UPLOAD_LIMITS.maxBatchSize;
  const results: string[] = [];
  for (let i = 0; i < ready.length; i += batchSize) {
    const batch = ready.slice(i, i + batchSize);
    const encoded = await Promise.all(
      batch.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "image/jpeg",
        dataBase64: await fileToBase64(file),
      }))
    );
    const res = await api<{ photoIds: string[] }>(
      {
        action: "uploadPhotos",
        slug,
        uploadedBy,
        files: encoded,
      },
      accessToken
    );
    results.push(...(res.photoIds || []));
    onProgress?.(Math.min(i + batch.length, ready.length), ready.length);
  }
  return results;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function apiOwner<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "שגיאה");
  }
  return data as T;
}

export async function ownerListEvents() {
  return apiOwner<{ events: EventRecord[] }>({ action: "ownerListEvents" });
}

export async function ownerCreateEvent(payload: {
  name: string;
  slug?: string;
  type?: string;
  date?: string;
  venue?: string;
  tagline?: string;
}) {
  return apiOwner<{
    success: boolean;
    eventId: string;
    slug: string;
    publicToken: string;
  }>({ action: "ownerCreateEvent", ...payload });
}

export async function ownerStats(slug: string) {
  return apiOwner<{ stats: EventStats }>({ action: "ownerGetStats", slug });
}

export async function ownerGuests(slug: string) {
  return apiOwner<{ guests: GuestRecord[] }>({ action: "ownerListGuests", slug });
}

export async function ownerBlessings(slug: string) {
  return apiOwner<{ blessings: BlessingRecord[] }>({
    action: "ownerListBlessings",
    slug,
  });
}

export async function ownerPhotos(slug: string) {
  return apiOwner<{ photos: PhotoRecord[] }>({ action: "ownerListPhotos", slug });
}

export async function ownerGetRsvps(slug: string) {
  return apiOwner<{ rsvps: import("@/types/mvp").RsvpRow[] }>({
    action: "ownerGetRsvps",
    slug,
  });
}

export async function ownerListActivity(slug: string) {
  return apiOwner<{ activity: import("@/types/mvp").ActivityRow[] }>({
    action: "ownerListActivity",
    slug,
  });
}

export async function ownerListGuestsEngagement(slug: string) {
  return apiOwner<{ guests: import("@/types/mvp").GuestEngagementRow[] }>({
    action: "ownerListGuestsEngagement",
    slug,
  });
}

export async function ownerCreateGuest(
  slug: string,
  data: { name: string; phone?: string; email?: string }
) {
  return apiOwner<{ guestId: string; inviteUrl: string; qrUrl: string }>({
    action: "ownerCreateGuest",
    slug,
    ...data,
  });
}

export async function ownerGenerateMemoryBook(slug: string) {
  return apiOwner<import("@/types/mvp").MemoryBook>({
    action: "ownerGenerateMemoryBook",
    slug,
  });
}

export async function ownerGetMemoryBook(slug: string) {
  return apiOwner<{ memoryBook: import("@/types/mvp").MemoryBook | null }>({
    action: "ownerGetMemoryBook",
    slug,
  });
}

export async function adminVerify(adminKey: string) {
  return apiAdmin<{ ok: boolean }>({ action: "adminPing" }, adminKey);
}

export async function adminListEvents(adminKey: string) {
  return apiAdmin<{ events: EventRecord[] }>({ action: "listEvents" }, adminKey);
}

export async function adminStats(slug: string, adminKey: string) {
  return apiAdmin<{ stats: EventStats }>({ action: "getStats", slug }, adminKey);
}

export async function adminGuests(slug: string, adminKey: string) {
  return apiAdmin<{ guests: GuestRecord[] }>({ action: "listGuests", slug }, adminKey);
}

export async function adminBlessings(slug: string, adminKey: string) {
  return apiAdmin<{ blessings: BlessingRecord[] }>({ action: "listBlessings", slug }, adminKey);
}

export async function adminPhotos(slug: string, adminKey: string) {
  return apiAdmin<{ photos: PhotoRecord[] }>({ action: "listPhotos", slug }, adminKey);
}

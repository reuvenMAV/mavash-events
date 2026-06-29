import { compressImagesForUpload } from "@/lib/image-compress";
import { UPLOAD_LIMITS } from "@/lib/upload-limits";
import type {
  ActivityRow,
  BlessingRow,
  EventInfo,
  FlowContext,
  GuestEngagementRow,
  MemoryBook,
  PhotoRow,
  ReminderRow,
  RsvpInput,
  RsvpResult,
  RsvpRow,
} from "@/types/mvp";

async function post<T>(
  body: Record<string, unknown>,
  opts?: { adminKey?: string; accessToken?: string }
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts?.adminKey) headers["x-admin-key"] = opts.adminKey;

  const res = await fetch("/api/events", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...body,
      ...(opts?.accessToken ? { accessToken: opts.accessToken } : {}),
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "שגיאה");
  return data as T;
}

export async function fetchEventForGuest(eventId: string, guestId: string) {
  return post<{
    event: EventInfo;
    guest: { guestId: string; name: string; phone: string; engagement: string };
    hasRsvp: boolean;
    rsvp: { attending: string; guestsCount: number } | null;
  }>({ action: "getEventById", eventId, guestId });
}

export async function trackGuestOpen(eventId: string, guestId: string) {
  return post<{ success: boolean; openCount: number }>({
    action: "trackOpen",
    eventId,
    guestId,
  });
}

export async function fetchEvent(slug: string, accessToken: string) {
  return post<{ event: EventInfo }>({ action: "getEvent", slug }, { accessToken });
}

export async function submitRsvp(ctx: FlowContext, payload: RsvpInput) {
  const base =
    ctx.mode === "guest"
      ? {
          action: "rsvp",
          eventId: ctx.eventId,
          guestId: ctx.guestId,
          name: payload.name,
          phone: payload.phone,
          attending: payload.attending,
          guestsCount: payload.guestsCount,
          notes: payload.notes,
        }
      : {
          action: "rsvp",
          slug: ctx.slug,
          name: payload.name,
          phone: payload.phone,
          attending: payload.attending,
          guestsCount: payload.guestsCount,
          notes: payload.notes,
        };
  return post<RsvpResult>(base, ctx.mode === "token" ? { accessToken: ctx.accessToken } : undefined);
}

export async function submitBlessing(ctx: FlowContext, message: string, guestId: string) {
  const body =
    ctx.mode === "guest"
      ? { action: "blessing", eventId: ctx.eventId, guestId: ctx.guestId, message }
      : {
          action: "blessing",
          slug: ctx.slug,
          guestId,
          message,
        };
  return post<{ success: boolean; blessingId: string }>(
    body,
    ctx.mode === "token" ? { accessToken: ctx.accessToken } : undefined
  );
}

export async function markFlowComplete(ctx: FlowContext) {
  if (ctx.mode !== "guest") return;
  return post<{ success: boolean }>({
    action: "markComplete",
    eventId: ctx.eventId,
    guestId: ctx.guestId,
  });
}

export async function uploadPhotos(
  ctx: FlowContext,
  guestId: string,
  files: File[],
  onProgress?: (done: number, total: number) => void
) {
  const compressed = await compressImagesForUpload(files);
  const ready = compressed.map((c) => c.file);
  const results: { photoId: string; driveUrl: string }[] = [];

  for (let i = 0; i < ready.length; i += UPLOAD_LIMITS.maxBatchSize) {
    const batch = ready.slice(i, i + UPLOAD_LIMITS.maxBatchSize);
    const encoded = await Promise.all(
      batch.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "image/jpeg",
        dataBase64: await fileToBase64(file),
      }))
    );
    const body =
      ctx.mode === "guest"
        ? {
            action: "uploadPhoto",
            eventId: ctx.eventId,
            guestId,
            files: encoded,
          }
        : {
            action: "uploadPhoto",
            slug: ctx.slug,
            guestId,
            files: encoded,
          };
    const res = await post<{ photos: { photoId: string; driveUrl: string }[] }>(
      body,
      ctx.mode === "token" ? { accessToken: ctx.accessToken } : undefined
    );
    results.push(...(res.photos || []));
    onProgress?.(Math.min(i + batch.length, ready.length), ready.length);
  }
  return results;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function adminPing(adminKey: string) {
  return post<{ ok: boolean }>({ action: "adminPing" }, { adminKey });
}

export async function fetchRsvps(slug: string, adminKey: string) {
  return post<{ rsvps: RsvpRow[] }>({ action: "getRsvps", slug }, { adminKey });
}

export async function fetchBlessings(slug: string, adminKey: string) {
  return post<{ blessings: BlessingRow[] }>({ action: "listBlessings", slug }, { adminKey });
}

export async function fetchPhotos(slug: string, adminKey: string) {
  return post<{ photos: PhotoRow[] }>({ action: "photos", slug }, { adminKey });
}

export async function fetchGuestsEngagement(slug: string, adminKey: string) {
  return post<{ guests: GuestEngagementRow[] }>(
    { action: "listGuestsEngagement", slug },
    { adminKey }
  );
}

export async function fetchActivity(slug: string, adminKey: string) {
  return post<{ activity: ActivityRow[] }>({ action: "listActivity", slug }, { adminKey });
}

export async function fetchReminders(slug: string, adminKey: string) {
  return post<{ reminders: ReminderRow[] }>({ action: "listReminders", slug }, { adminKey });
}

export async function createGuest(
  slug: string,
  adminKey: string,
  data: { name: string; phone?: string; email?: string }
) {
  return post<{ guestId: string; inviteUrl: string; qrUrl: string }>(
    { action: "createGuest", slug, ...data },
    { adminKey }
  );
}

export async function generateMemoryBook(slug: string, adminKey: string) {
  return post<MemoryBook>({ action: "generateMemoryBook", slug }, { adminKey });
}

export async function fetchMemoryBook(slug: string, adminKey: string) {
  return post<{ memoryBook: MemoryBook | null }>({ action: "getMemoryBook", slug }, { adminKey });
}

export async function setupReminders(adminKey: string) {
  return post<{ success: boolean }>({ action: "setupReminders" }, { adminKey });
}

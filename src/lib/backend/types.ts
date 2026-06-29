import type {
  BlessingRecord,
  EventRecord,
  PhotoRecord,
  RsvpPayload,
} from "@/types/events";
import type {
  ActivityRow,
  BlessingRow,
  GuestEngagementRow,
  MemoryBook,
  PhotoRow,
  ReminderRow,
  RsvpRow,
} from "@/types/mvp";

export type AccessContext = { accessToken: string };
export type GuestContext = { guestId: string; eventId: string };
export type AdminContext = { adminKey: string };

export type PhotoFilePayload = {
  name: string;
  mimeType: string;
  dataBase64: string;
};

export interface EventsBackend {
  getEvent(slug: string, access: AccessContext): Promise<{ event: EventRecord }>;
  getEventForGuest(
    eventId: string,
    guestId: string
  ): Promise<{
    event: EventRecord;
    guest: { guestId: string; name: string; phone: string; engagement: string };
    hasRsvp: boolean;
    rsvp: { attending: string; guestsCount: number } | null;
  }>;
  trackOpen(guest: GuestContext): Promise<{ success: boolean; openCount: number }>;

  submitRsvp(
    payload: RsvpPayload & { guestId?: string; eventId?: string },
    access?: AccessContext
  ): Promise<{ success: boolean; guestId: string; rsvpId: string; attending: string }>;

  submitBlessing(
    slug: string,
    guestId: string,
    message: string,
    ctx: GuestContext
  ): Promise<{ success: boolean; blessingId: string }>;

  uploadPhotos(
    guestId: string,
    files: PhotoFilePayload[],
    ctx: GuestContext
  ): Promise<{ photos: { photoId: string; driveUrl: string }[] }>;

  markComplete(ctx: GuestContext): Promise<{ success: boolean }>;

  adminPing(ctx: AdminContext): Promise<{ ok: boolean }>;
  getRsvps(slug: string, ctx: AdminContext): Promise<{ rsvps: RsvpRow[] }>;
  listBlessings(slug: string, ctx: AdminContext): Promise<{ blessings: BlessingRow[] }>;
  listPhotos(slug: string, ctx: AdminContext): Promise<{ photos: PhotoRow[] }>;
  listGuestsEngagement(
    slug: string,
    ctx: AdminContext
  ): Promise<{ guests: GuestEngagementRow[] }>;
  listActivity(slug: string, ctx: AdminContext): Promise<{ activity: ActivityRow[] }>;
  listReminders(slug: string, ctx: AdminContext): Promise<{ reminders: ReminderRow[] }>;
  createGuest(
    slug: string,
    name: string,
    ctx: AdminContext,
    opts?: { phone?: string; email?: string }
  ): Promise<{ guestId: string; inviteUrl: string; qrUrl: string }>;
  generateMemoryBook(slug: string, ctx: AdminContext): Promise<MemoryBook>;
  getMemoryBook(slug: string, ctx: AdminContext): Promise<{ memoryBook: MemoryBook | null }>;
  setupReminders(ctx: AdminContext): Promise<{ success: boolean }>;
}

export type { BlessingRecord, PhotoRecord };

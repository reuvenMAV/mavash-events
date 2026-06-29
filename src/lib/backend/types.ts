import type {
  BlessingPayload,
  BlessingRecord,
  EventRecord,
  EventStats,
  GuestRecord,
  PhotoRecord,
  RsvpPayload,
} from "@/types/events";

/** Public API context — token from invite link (?t=) */
export type AccessContext = {
  accessToken: string;
};

export type AdminContext = {
  adminKey: string;
};

/** Logged-in platform user — tenantId equals userId (pooled multi-tenancy) */
export type OwnerContext = {
  tenantId: string;
};

export type CreateEventPayload = {
  slug?: string;
  name: string;
  type?: string;
  date?: string;
  venue?: string;
  tagline?: string;
  theme?: { primary: string; accent: string; background: string };
};

export type PhotoFilePayload = {
  name: string;
  mimeType: string;
  dataBase64: string;
};

/**
 * Stable contract between UI and data layer.
 * Implementations: GasEventsBackend (now), FirestoreEventsBackend (future).
 */
export interface EventsBackend {
  getEvent(slug: string, access: AccessContext): Promise<{ event: EventRecord }>;
  submitRsvp(payload: RsvpPayload, access: AccessContext): Promise<{ success: boolean; guestId: string }>;
  addBlessing(payload: BlessingPayload, access: AccessContext): Promise<{ success: boolean; blessingId: string }>;
  uploadPhotos(
    slug: string,
    files: PhotoFilePayload[],
    access: AccessContext,
    uploadedBy?: string
  ): Promise<{ photoIds: string[] }>;
  listPhotos(slug: string, access: AccessContext): Promise<{ photos: PhotoRecord[] }>;

  adminPing(ctx: AdminContext): Promise<{ ok: boolean }>;
  listEvents(ctx: AdminContext): Promise<{ events: EventRecord[] }>;
  getStats(slug: string, ctx: AdminContext): Promise<{ stats: EventStats }>;
  listGuests(slug: string, ctx: AdminContext): Promise<{ guests: GuestRecord[] }>;
  listBlessings(slug: string, ctx: AdminContext): Promise<{ blessings: BlessingRecord[] }>;
  listPhotosAdmin(slug: string, ctx: AdminContext): Promise<{ photos: PhotoRecord[] }>;

  /** Tenant-scoped owner API (session user) */
  ownerListEvents(ctx: OwnerContext): Promise<{ events: EventRecord[] }>;
  ownerCreateEvent(payload: CreateEventPayload, ctx: OwnerContext): Promise<{
    success: boolean;
    eventId: string;
    slug: string;
    publicToken: string;
  }>;
  ownerGetStats(slug: string, ctx: OwnerContext): Promise<{ stats: EventStats }>;
  ownerListGuests(slug: string, ctx: OwnerContext): Promise<{ guests: GuestRecord[] }>;
  ownerListBlessings(slug: string, ctx: OwnerContext): Promise<{ blessings: BlessingRecord[] }>;
  ownerListPhotos(slug: string, ctx: OwnerContext): Promise<{ photos: PhotoRecord[] }>;
}

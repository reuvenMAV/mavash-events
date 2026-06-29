import { gasRequest } from "@/lib/gas-server";
import type {
  AdminContext,
  AccessContext,
  CreateEventPayload,
  EventsBackend,
  GuestContext,
  OwnerContext,
  PhotoFilePayload,
} from "./types";
import type { EventRecord, RsvpPayload } from "@/types/events";
import type {
  ActivityRow,
  BlessingRow,
  GuestEngagementRow,
  MemoryBook,
  PhotoRow,
  ReminderRow,
  RsvpRow,
} from "@/types/mvp";

export class GasEventsBackend implements EventsBackend {
  async getEvent(slug: string, access: AccessContext) {
    return gasRequest<{ event: EventRecord }>("getEvent", {
      slug,
      accessToken: access.accessToken,
    });
  }

  async getEventForGuest(eventId: string, guestId: string) {
    return gasRequest<{
      event: EventRecord;
      guest: { guestId: string; name: string; phone: string; engagement: string };
      hasRsvp: boolean;
      rsvp: { attending: string; guestsCount: number } | null;
    }>("getEventById", { eventId, guestId });
  }

  async trackOpen(guest: GuestContext) {
    return gasRequest<{ success: boolean; openCount: number }>("trackOpen", guest);
  }

  async submitRsvp(
    payload: RsvpPayload & { guestId?: string; eventId?: string },
    access?: AccessContext
  ) {
    return gasRequest<{
      success: boolean;
      guestId: string;
      rsvpId: string;
      attending: string;
    }>("rsvp", {
      ...payload,
      ...(access ? { accessToken: access.accessToken } : {}),
    });
  }

  async submitBlessing(_slug: string, guestId: string, message: string, ctx: GuestContext) {
    return gasRequest<{ success: boolean; blessingId: string }>("blessing", {
      guestId,
      message,
      eventId: ctx.eventId,
    });
  }

  async uploadPhotos(guestId: string, files: PhotoFilePayload[], ctx: GuestContext) {
    return gasRequest<{ photos: { photoId: string; driveUrl: string }[] }>("uploadPhoto", {
      guestId,
      files,
      eventId: ctx.eventId,
    });
  }

  async markComplete(ctx: GuestContext) {
    return gasRequest<{ success: boolean }>("markComplete", ctx);
  }

  async adminPing(ctx: AdminContext) {
    return gasRequest<{ ok: boolean }>("adminPing", {}, ctx.adminKey);
  }

  async getRsvps(slug: string, ctx: AdminContext) {
    return gasRequest<{ rsvps: RsvpRow[] }>("getRsvps", { slug }, ctx.adminKey);
  }

  async listBlessings(slug: string, ctx: AdminContext) {
    return gasRequest<{ blessings: BlessingRow[] }>("listBlessings", { slug }, ctx.adminKey);
  }

  async listPhotos(slug: string, ctx: AdminContext) {
    return gasRequest<{ photos: PhotoRow[] }>("photos", { slug }, ctx.adminKey);
  }

  async listGuestsEngagement(slug: string, ctx: AdminContext) {
    return gasRequest<{ guests: GuestEngagementRow[] }>(
      "listGuestsEngagement",
      { slug },
      ctx.adminKey
    );
  }

  async listActivity(slug: string, ctx: AdminContext) {
    return gasRequest<{ activity: ActivityRow[] }>("listActivity", { slug }, ctx.adminKey);
  }

  async listReminders(slug: string, ctx: AdminContext) {
    return gasRequest<{ reminders: ReminderRow[] }>("listReminders", { slug }, ctx.adminKey);
  }

  async createGuest(
    slug: string,
    name: string,
    ctx: AdminContext,
    opts?: { phone?: string; email?: string }
  ) {
    return gasRequest<{ guestId: string; inviteUrl: string; qrUrl: string }>(
      "createGuest",
      { slug, name, phone: opts?.phone, email: opts?.email },
      ctx.adminKey
    );
  }

  async generateMemoryBook(slug: string, ctx: AdminContext) {
    return gasRequest<MemoryBook>("generateMemoryBook", { slug }, ctx.adminKey);
  }

  async getMemoryBook(slug: string, ctx: AdminContext) {
    return gasRequest<{ memoryBook: MemoryBook | null }>("getMemoryBook", { slug }, ctx.adminKey);
  }

  async setupReminders(ctx: AdminContext) {
    return gasRequest<{ success: boolean }>("setupReminders", {}, ctx.adminKey);
  }

  private ownerPayload(ctx: OwnerContext, extra: object = {}) {
    return { tenantId: ctx.tenantId, internalSecret: ctx.internalSecret, ...extra };
  }

  async ownerListEvents(ctx: OwnerContext) {
    return gasRequest<{ events: EventRecord[] }>("ownerListEvents", this.ownerPayload(ctx));
  }

  async ownerCreateEvent(payload: CreateEventPayload, ctx: OwnerContext) {
    return gasRequest<{
      success: boolean;
      eventId: string;
      slug: string;
      publicToken: string;
    }>("ownerCreateEvent", this.ownerPayload(ctx, payload));
  }

  async ownerGetStats(slug: string, ctx: OwnerContext) {
    return gasRequest<{ stats: import("@/types/events").EventStats }>(
      "ownerGetStats",
      this.ownerPayload(ctx, { slug })
    );
  }

  async ownerListGuestsEngagement(slug: string, ctx: OwnerContext) {
    return gasRequest<{ guests: GuestEngagementRow[] }>(
      "ownerListGuestsEngagement",
      this.ownerPayload(ctx, { slug })
    );
  }

  async ownerListBlessings(slug: string, ctx: OwnerContext) {
    return gasRequest<{ blessings: BlessingRow[] }>(
      "ownerListBlessings",
      this.ownerPayload(ctx, { slug })
    );
  }

  async ownerListPhotos(slug: string, ctx: OwnerContext) {
    return gasRequest<{ photos: PhotoRow[] }>(
      "ownerListPhotos",
      this.ownerPayload(ctx, { slug })
    );
  }

  async ownerListActivity(slug: string, ctx: OwnerContext) {
    return gasRequest<{ activity: ActivityRow[] }>(
      "ownerListActivity",
      this.ownerPayload(ctx, { slug })
    );
  }

  async ownerGetRsvps(slug: string, ctx: OwnerContext) {
    return gasRequest<{ rsvps: RsvpRow[] }>("ownerGetRsvps", this.ownerPayload(ctx, { slug }));
  }

  async ownerCreateGuest(
    slug: string,
    name: string,
    ctx: OwnerContext,
    opts?: { phone?: string; email?: string }
  ) {
    return gasRequest<{ guestId: string; inviteUrl: string; qrUrl: string }>(
      "ownerCreateGuest",
      this.ownerPayload(ctx, { slug, name, phone: opts?.phone, email: opts?.email })
    );
  }

  async ownerGenerateMemoryBook(slug: string, ctx: OwnerContext) {
    return gasRequest<MemoryBook>("ownerGenerateMemoryBook", this.ownerPayload(ctx, { slug }));
  }

  async ownerGetMemoryBook(slug: string, ctx: OwnerContext) {
    return gasRequest<{ memoryBook: MemoryBook | null }>(
      "ownerGetMemoryBook",
      this.ownerPayload(ctx, { slug })
    );
  }
}

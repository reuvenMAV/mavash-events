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
    const attending = payload.attending === "no" ? "no" : "yes";
    const body = {
      slug: payload.slug,
      name: payload.name,
      phone: payload.phone,
      status: attending,
      attending,
      guestsCount: payload.guestsCount,
      notes: payload.notes,
      guestId: payload.guestId,
      eventId: payload.eventId,
      ...(access ? { accessToken: access.accessToken } : {}),
    };

    const result = await gasRequest<{
      success: boolean;
      guestId: string;
      rsvpId?: string;
      inviteToken?: string;
    }>("submitRsvp", body);

    return {
      success: result.success,
      guestId: result.guestId,
      rsvpId: result.rsvpId || result.inviteToken || result.guestId,
      attending,
    };
  }

  async submitBlessing(
    slug: string,
    guestName: string,
    message: string,
    ctx: GuestContext & { accessToken?: string }
  ) {
    if (ctx.accessToken) {
      return gasRequest<{ success: boolean; blessingId: string }>("addBlessing", {
        slug,
        guestName,
        message,
        accessToken: ctx.accessToken,
      });
    }

    return gasRequest<{ success: boolean; blessingId: string }>("addBlessing", {
      slug,
      guestName,
      message,
      guestId: ctx.guestId,
      eventId: ctx.eventId,
    });
  }

  async uploadPhotos(
    slug: string,
    files: PhotoFilePayload[],
    ctx: GuestContext & { accessToken?: string }
  ) {
    if (ctx.accessToken) {
      return gasRequest<{ photos: { photoId: string; driveUrl: string }[] }>("uploadPhotos", {
        slug,
        files,
        accessToken: ctx.accessToken,
      });
    }

    return gasRequest<{ photos: { photoId: string; driveUrl: string }[] }>("uploadPhotos", {
      slug,
      files,
      guestId: ctx.guestId,
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

  /** Deployed GAS uses legacy names (createEvent, listEvents) — not owner* prefix. */
  private async ownerGasRequest<T>(gasAction: string, ctx: OwnerContext, extra: object = {}) {
    return gasRequest<T>(gasAction, this.ownerPayload(ctx, extra));
  }

  async ownerListEvents(ctx: OwnerContext) {
    return this.ownerGasRequest<{ events: EventRecord[] }>("listEvents", ctx);
  }

  async ownerCreateEvent(payload: CreateEventPayload, ctx: OwnerContext) {
    return this.ownerGasRequest<{
      success: boolean;
      eventId: string;
      slug: string;
      publicToken: string;
    }>("createEvent", ctx, payload);
  }

  async ownerGetStats(slug: string, ctx: OwnerContext) {
    return this.ownerGasRequest<{ stats: import("@/types/events").EventStats }>(
      "getStats",
      ctx,
      { slug }
    );
  }

  async ownerListGuestsEngagement(slug: string, ctx: OwnerContext) {
    const result = await this.ownerGasRequest<{ guests: GuestEngagementRow[] }>(
      "listGuests",
      ctx,
      { slug }
    );
    return { guests: result.guests || [] };
  }

  async ownerListBlessings(slug: string, ctx: OwnerContext) {
    return this.ownerGasRequest<{ blessings: BlessingRow[] }>("listBlessings", ctx, { slug });
  }

  async ownerListPhotos(slug: string, ctx: OwnerContext) {
    return this.ownerGasRequest<{ photos: PhotoRow[] }>("listPhotos", ctx, { slug });
  }

  async ownerListActivity(_slug: string, _ctx: OwnerContext) {
    return { activity: [] as ActivityRow[] };
  }

  async ownerGetRsvps(_slug: string, _ctx: OwnerContext) {
    return { rsvps: [] as RsvpRow[] };
  }

  async ownerCreateGuest(
    _slug: string,
    _name: string,
    _ctx: OwnerContext,
    _opts?: { phone?: string; email?: string }
  ): Promise<{ guestId: string; inviteUrl: string; qrUrl: string }> {
    throw new Error("הוספת מוזמנים אישיים עדיין לא זמינה — עדכנו את Apps Script (createGuest)");
  }

  async ownerGenerateMemoryBook(_slug: string, _ctx: OwnerContext): Promise<MemoryBook> {
    throw new Error("ספר זיכרונות עדיין לא זמין בשרת הנוכחי");
  }

  async ownerGetMemoryBook(_slug: string, _ctx: OwnerContext) {
    return { memoryBook: null as MemoryBook | null };
  }
}

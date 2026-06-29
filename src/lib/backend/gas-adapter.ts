/**
 * Google Apps Script backend — MVP implementation.
 *
 * QUOTA: 6 min execution / daily limits. Do not call GAS from components;
 * only this adapter talks to gas-server.ts.
 *
 * MIGRATION: Replace with firestore-adapter.ts implementing EventsBackend.
 */
import { gasRequest } from "@/lib/gas-server";
import { internalGasPayload } from "@/lib/auth/internal";
import type {
  AccessContext,
  AdminContext,
  CreateEventPayload,
  EventsBackend,
  OwnerContext,
  PhotoFilePayload,
} from "./types";
import type {
  BlessingPayload,
  BlessingRecord,
  EventRecord,
  EventStats,
  GuestRecord,
  PhotoRecord,
  RsvpPayload,
} from "@/types/events";

function withToken<T extends object>(payload: T, access: AccessContext) {
  return { ...payload, accessToken: access.accessToken };
}

export class GasEventsBackend implements EventsBackend {
  async getEvent(slug: string, access: AccessContext) {
    return gasRequest<{ event: EventRecord }>("getEvent", {
      slug,
      accessToken: access.accessToken,
    });
  }

  async submitRsvp(payload: RsvpPayload, access: AccessContext) {
    return gasRequest<{ success: boolean; guestId: string }>(
      "submitRsvp",
      withToken(payload, access)
    );
  }

  async addBlessing(payload: BlessingPayload, access: AccessContext) {
    return gasRequest<{ success: boolean; blessingId: string }>(
      "addBlessing",
      withToken(payload, access)
    );
  }

  async uploadPhotos(
    slug: string,
    files: PhotoFilePayload[],
    access: AccessContext,
    uploadedBy?: string
  ) {
    return gasRequest<{ photoIds: string[] }>(
      "uploadPhotos",
      withToken({ slug, files, uploadedBy }, access)
    );
  }

  async listPhotos(slug: string, access: AccessContext) {
    return gasRequest<{ photos: PhotoRecord[] }>("listPhotos", {
      slug,
      accessToken: access.accessToken,
    });
  }

  async adminPing(ctx: AdminContext) {
    return gasRequest<{ ok: boolean }>("adminPing", {}, ctx.adminKey);
  }

  async listEvents(ctx: AdminContext) {
    return gasRequest<{ events: EventRecord[] }>("listEvents", {}, ctx.adminKey);
  }

  async getStats(slug: string, ctx: AdminContext) {
    return gasRequest<{ stats: EventStats }>("getStats", { slug }, ctx.adminKey);
  }

  async listGuests(slug: string, ctx: AdminContext) {
    return gasRequest<{ guests: GuestRecord[] }>("listGuests", { slug }, ctx.adminKey);
  }

  async listBlessings(slug: string, ctx: AdminContext) {
    return gasRequest<{ blessings: BlessingRecord[] }>("listBlessings", { slug }, ctx.adminKey);
  }

  async listPhotosAdmin(slug: string, ctx: AdminContext) {
    return gasRequest<{ photos: PhotoRecord[] }>("listPhotos", { slug }, ctx.adminKey);
  }

  async ownerListEvents(ctx: OwnerContext) {
    return gasRequest<{ events: EventRecord[] }>("listEvents", internalGasPayload(ctx.tenantId));
  }

  async ownerCreateEvent(payload: CreateEventPayload, ctx: OwnerContext) {
    return gasRequest<{ success: boolean; eventId: string; slug: string; publicToken: string }>(
      "createEvent",
      { ...payload, ...internalGasPayload(ctx.tenantId) }
    );
  }

  async ownerGetStats(slug: string, ctx: OwnerContext) {
    return gasRequest<{ stats: EventStats }>("getStats", {
      slug,
      ...internalGasPayload(ctx.tenantId),
    });
  }

  async ownerListGuests(slug: string, ctx: OwnerContext) {
    return gasRequest<{ guests: GuestRecord[] }>("listGuests", {
      slug,
      ...internalGasPayload(ctx.tenantId),
    });
  }

  async ownerListBlessings(slug: string, ctx: OwnerContext) {
    return gasRequest<{ blessings: BlessingRecord[] }>("listBlessings", {
      slug,
      ...internalGasPayload(ctx.tenantId),
    });
  }

  async ownerListPhotos(slug: string, ctx: OwnerContext) {
    return gasRequest<{ photos: PhotoRecord[] }>("listPhotos", {
      slug,
      ...internalGasPayload(ctx.tenantId),
    });
  }
}

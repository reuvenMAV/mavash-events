import { GasEventsBackend } from "./gas-adapter";
import { SupabaseOwnerEventsBackend } from "./supabase-owner";
import type {
  CreateEventPayload,
  EventsBackend,
  OwnerContext,
} from "./types";
import type { EventRecord } from "@/types/events";
import { useSupabaseForOwnerEvents } from "@/lib/owner-events-source";

/**
 * GAS for all guest/admin flows; Supabase optionally for owner event CRUD.
 * On create: dual-write to GAS so guest links (/e/slug?t=) keep working.
 */
export class HybridEventsBackend implements EventsBackend {
  private gas = new GasEventsBackend();
  private supabaseOwner = new SupabaseOwnerEventsBackend();

  async ownerListEvents(ctx: OwnerContext) {
    if (!useSupabaseForOwnerEvents()) {
      return this.gas.ownerListEvents(ctx);
    }

    const [sbResult, gasResult] = await Promise.all([
      this.supabaseOwner.ownerListEvents(ctx).catch(() => ({ events: [] as EventRecord[] })),
      this.gas.ownerListEvents(ctx).catch(() => ({ events: [] as EventRecord[] })),
    ]);

    const bySlug = new Map<string, EventRecord>();
    for (const ev of gasResult.events) bySlug.set(ev.slug, ev);
    for (const ev of sbResult.events) bySlug.set(ev.slug, ev);
    const events = [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "he"));
    return { events };
  }

  async ownerCreateEvent(payload: CreateEventPayload, ctx: OwnerContext) {
    if (!useSupabaseForOwnerEvents()) {
      return this.gas.ownerCreateEvent(payload, ctx);
    }

    const created = await this.supabaseOwner.ownerCreateEvent(payload, ctx);

    try {
      await this.gas.ownerCreateEvent(
        { ...payload, slug: created.slug },
        ctx
      );
    } catch (err) {
      console.error("[hybrid] GAS sync after Supabase create failed:", err);
    }

    return created;
  }

  async ownerGetStats(slug: string, ctx: OwnerContext) {
    if (!useSupabaseForOwnerEvents()) {
      return this.gas.ownerGetStats(slug, ctx);
    }

    try {
      return await this.gas.ownerGetStats(slug, ctx);
    } catch {
      return this.supabaseOwner.ownerGetStats(slug, ctx);
    }
  }

  // ─── Delegate everything else to GAS ───────────────────────────────────────

  getEvent = this.gas.getEvent.bind(this.gas);
  getEventForGuest = this.gas.getEventForGuest.bind(this.gas);
  trackOpen = this.gas.trackOpen.bind(this.gas);
  submitRsvp = this.gas.submitRsvp.bind(this.gas);
  submitBlessing = this.gas.submitBlessing.bind(this.gas);
  uploadPhotos = this.gas.uploadPhotos.bind(this.gas);
  markComplete = this.gas.markComplete.bind(this.gas);
  adminPing = this.gas.adminPing.bind(this.gas);
  getRsvps = this.gas.getRsvps.bind(this.gas);
  listBlessings = this.gas.listBlessings.bind(this.gas);
  listPhotos = this.gas.listPhotos.bind(this.gas);
  listGuestsEngagement = this.gas.listGuestsEngagement.bind(this.gas);
  listActivity = this.gas.listActivity.bind(this.gas);
  listReminders = this.gas.listReminders.bind(this.gas);
  createGuest = this.gas.createGuest.bind(this.gas);
  generateMemoryBook = this.gas.generateMemoryBook.bind(this.gas);
  getMemoryBook = this.gas.getMemoryBook.bind(this.gas);
  setupReminders = this.gas.setupReminders.bind(this.gas);
  ownerListGuestsEngagement = this.gas.ownerListGuestsEngagement.bind(this.gas);
  ownerListBlessings = this.gas.ownerListBlessings.bind(this.gas);
  ownerListPhotos = this.gas.ownerListPhotos.bind(this.gas);
  ownerListActivity = this.gas.ownerListActivity.bind(this.gas);
  ownerGetRsvps = this.gas.ownerGetRsvps.bind(this.gas);
  ownerCreateGuest = this.gas.ownerCreateGuest.bind(this.gas);
  ownerGenerateMemoryBook = this.gas.ownerGenerateMemoryBook.bind(this.gas);
  ownerGetMemoryBook = this.gas.ownerGetMemoryBook.bind(this.gas);
}

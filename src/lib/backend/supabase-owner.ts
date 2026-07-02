import { randomBytes, randomUUID } from "crypto";
import type { EventRecord, EventTheme } from "@/types/events";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { CreateEventPayload, OwnerContext } from "./types";

type EventRow = {
  event_id: string;
  tenant_id: string;
  slug: string;
  name: string;
  type: string;
  date: string;
  venue: string;
  tagline: string;
  theme_json: { primary?: string; accent?: string; background?: string } | null;
  public_token: string;
  active: boolean;
};

const DEFAULT_THEME: EventTheme = {
  primary: "#1e3a5f",
  accent: "#c9a227",
  background: "#faf8f5",
};

function mapTheme(raw: EventRow["theme_json"]): EventTheme {
  return {
    primary: raw?.primary || DEFAULT_THEME.primary,
    accent: raw?.accent || DEFAULT_THEME.accent,
    background: raw?.background || DEFAULT_THEME.background,
  };
}

function mapRow(row: EventRow): EventRecord {
  return {
    eventId: row.event_id,
    tenantId: row.tenant_id,
    slug: row.slug,
    name: row.name,
    type: row.type as EventRecord["type"],
    date: row.date || "",
    venue: row.venue || "",
    tagline: row.tagline || "",
    theme: mapTheme(row.theme_json),
    active: row.active,
  };
}

function emptyStats(): import("@/types/events").EventStats {
  return {
    guestsTotal: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    guestsAttending: 0,
    blessingsCount: 0,
    photosCount: 0,
  };
}

/** Supabase implementation — owner dashboard only (phase 1). */
export class SupabaseOwnerEventsBackend {
  async ownerListEvents(ctx: OwnerContext) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("events")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { events: (data as EventRow[]).map(mapRow) };
  }

  async ownerCreateEvent(payload: CreateEventPayload, ctx: OwnerContext) {
    const sb = getSupabaseAdmin();
    const name = String(payload.name || "").trim();
    if (!name) throw new Error("חסר שם אירוע");

    const { data: existingRows } = await sb
      .from("events")
      .select("slug")
      .eq("tenant_id", ctx.tenantId);

    const existingSlugs = (existingRows || []).map((r) => String((r as { slug: string }).slug));
    const baseSlug = payload.slug ? slugify(payload.slug) : slugify(name);
    const slug = uniqueSlug(baseSlug, existingSlugs);
    const eventId = randomUUID();
    const publicToken = randomBytes(32).toString("hex");

    const row = {
      event_id: eventId,
      tenant_id: ctx.tenantId,
      slug,
      name,
      type: payload.type || "other",
      date: payload.date || "",
      venue: payload.venue || "",
      tagline: payload.tagline || "",
      theme_json: DEFAULT_THEME,
      public_token: publicToken,
      active: true,
    };

    const { error } = await sb.from("events").insert(row);
    if (error) {
      if (error.code === "23505") throw new Error("slug כבר קיים");
      throw new Error(error.message);
    }

    return { success: true, eventId, slug, publicToken };
  }

  async ownerGetStats(slug: string, ctx: OwnerContext) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("events")
      .select("event_id")
      .eq("tenant_id", ctx.tenantId)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("אירוע לא נמצא");

    // Phase 1: RSVP/blessings/photos still on GAS — stats from Supabase are placeholders.
    return { stats: emptyStats() };
  }
}

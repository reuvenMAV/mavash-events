import { NextResponse } from "next/server";
import { getEventsBackend } from "@/lib/backend";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIp,
  rateLimitKey,
} from "@/lib/rate-limit";
import type { RsvpPayload } from "@/types/events";

const GUEST_ACTIONS = new Set([
  "getEventById",
  "getGuest",
  "trackOpen",
  "markComplete",
  "rsvp",
  "blessing",
  "uploadPhoto",
]);

const TOKEN_ACTIONS = new Set(["getEvent", "rsvp", "blessing", "uploadPhoto"]);

const ADMIN_ACTIONS = new Set([
  "adminPing",
  "setupSheets",
  "setupReminders",
  "getRsvps",
  "listBlessings",
  "photos",
  "listGuestsEngagement",
  "listActivity",
  "listReminders",
  "createGuest",
  "generateMemoryBook",
  "getMemoryBook",
]);

type Action = keyof typeof RATE_LIMITS | string;

function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "יותר מדי בקשות — נסו שוב בעוד כמה דקות" },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

function applyRateLimit(action: Action, ip: string, id?: string) {
  const aliases: Record<string, keyof typeof RATE_LIMITS> = {
    rsvp: "submitRsvp",
    blessing: "addBlessing",
    uploadPhoto: "uploadPhotos",
    trackOpen: "getEvent",
  };
  const key = aliases[action] || (action as keyof typeof RATE_LIMITS);
  const rule = RATE_LIMITS[key];
  if (!rule) return null;
  const result = checkRateLimit({
    key: rateLimitKey(ip, key, id),
    limit: rule.limit,
    windowMs: rule.windowMs,
  });
  if (!result.ok) return rateLimitResponse(result.retryAfterSec);
  return null;
}

function guestCtx(body: Record<string, unknown>) {
  return {
    guestId: String(body.guestId || ""),
    eventId: String(body.eventId || ""),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "").trim();
    if (!action) {
      return NextResponse.json({ error: "חסר action" }, { status: 400 });
    }

    const ip = clientIp(request);
    const accessToken =
      typeof body.accessToken === "string" ? body.accessToken : undefined;
    const adminKey = request.headers.get("x-admin-key") || undefined;
    const backend = getEventsBackend();
    const slug = String(body.slug || "");
    const guestId = String(body.guestId || "");
    const eventId = String(body.eventId || "");

    if (ADMIN_ACTIONS.has(action)) {
      if (!adminKey) {
        return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
      }
      const admin = { adminKey };
      switch (action) {
        case "adminPing":
          return NextResponse.json(await backend.adminPing(admin));
        case "setupReminders":
          return NextResponse.json(await backend.setupReminders(admin));
        case "getRsvps":
          return NextResponse.json(await backend.getRsvps(slug, admin));
        case "listBlessings":
          return NextResponse.json(await backend.listBlessings(slug, admin));
        case "photos":
          return NextResponse.json(await backend.listPhotos(slug, admin));
        case "listGuestsEngagement":
          return NextResponse.json(await backend.listGuestsEngagement(slug, admin));
        case "listActivity":
          return NextResponse.json(await backend.listActivity(slug, admin));
        case "listReminders":
          return NextResponse.json(await backend.listReminders(slug, admin));
        case "createGuest":
          return NextResponse.json(
            await backend.createGuest(
              slug,
              String(body.name || ""),
              admin,
              {
                phone: typeof body.phone === "string" ? body.phone : undefined,
                email: typeof body.email === "string" ? body.email : undefined,
              }
            )
          );
        case "generateMemoryBook":
          return NextResponse.json(await backend.generateMemoryBook(slug, admin));
        case "getMemoryBook":
          return NextResponse.json(await backend.getMemoryBook(slug, admin));
        default:
          return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
      }
    }

    const hasGuest = Boolean(guestId && eventId);
    const hasToken = Boolean(accessToken);

    if (GUEST_ACTIONS.has(action) && hasGuest) {
      const limited = applyRateLimit(action, ip, guestId);
      if (limited) return limited;
      const ctx = guestCtx(body);

      switch (action) {
        case "getEventById":
        case "getGuest":
          return NextResponse.json(await backend.getEventForGuest(eventId, guestId));
        case "trackOpen":
          return NextResponse.json(await backend.trackOpen(ctx));
        case "markComplete":
          return NextResponse.json(await backend.markComplete(ctx));
        case "rsvp": {
          const rsvp: RsvpPayload & { guestId: string; eventId: string } = {
            slug,
            guestId,
            eventId,
            name: String(body.name || ""),
            phone: typeof body.phone === "string" ? body.phone : undefined,
            attending:
              body.attending === "yes" || body.attending === "no"
                ? body.attending
                : "yes",
            guestsCount: Number(body.guestsCount) || 0,
            notes: typeof body.notes === "string" ? body.notes : undefined,
          };
          return NextResponse.json(await backend.submitRsvp(rsvp));
        }
        case "blessing":
          return NextResponse.json(
            await backend.submitBlessing(
              slug,
              guestId,
              String(body.message || ""),
              ctx
            )
          );
        case "uploadPhoto": {
          const files =
            (body.files as { name: string; mimeType: string; dataBase64: string }[]) || [];
          return NextResponse.json(await backend.uploadPhotos(guestId, files, ctx));
        }
        default:
          break;
      }
    }

    if (TOKEN_ACTIONS.has(action) && hasToken && !adminKey) {
      const limited = applyRateLimit(action, ip, accessToken);
      if (limited) return limited;
      const access = { accessToken: accessToken! };

      switch (action) {
        case "getEvent":
          return NextResponse.json(await backend.getEvent(slug, access));
        case "rsvp": {
          const rsvp: RsvpPayload = {
            slug,
            name: String(body.name || ""),
            phone: typeof body.phone === "string" ? body.phone : undefined,
            attending:
              body.attending === "yes" || body.attending === "no"
                ? body.attending
                : "yes",
            guestsCount: Number(body.guestsCount) || 0,
            notes: typeof body.notes === "string" ? body.notes : undefined,
          };
          return NextResponse.json(await backend.submitRsvp(rsvp, access));
        }
        case "blessing":
          return NextResponse.json(
            await backend.submitBlessing(
              slug,
              guestId,
              String(body.message || ""),
              { guestId, eventId }
            )
          );
        case "uploadPhoto": {
          const files =
            (body.files as { name: string; mimeType: string; dataBase64: string }[]) || [];
          return NextResponse.json(
            await backend.uploadPhotos(guestId, files, { guestId, eventId })
          );
        }
        default:
          break;
      }
    }

    return NextResponse.json({ error: `Unknown or unauthorized action: ${action}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    const status =
      message.includes("אין הרשאה") || message.includes("קוד גישה") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

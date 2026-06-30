import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { internalGasPayload } from "@/lib/auth/internal";
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

const TOKEN_ACTIONS = new Set(["getEvent", "rsvp", "blessing", "uploadPhoto", "markComplete"]);

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

const OWNER_ACTIONS = new Set([
  "ownerListEvents",
  "ownerCreateEvent",
  "ownerGetStats",
  "ownerListGuests",
  "ownerListBlessings",
  "ownerListPhotos",
  "ownerListGuestsEngagement",
  "ownerListActivity",
  "ownerCreateGuest",
  "ownerGenerateMemoryBook",
  "ownerGetMemoryBook",
  "ownerGetRsvps",
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

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
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

    if (OWNER_ACTIONS.has(action)) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
      }
      const owner = internalGasPayload(session.userId);
      try {
        switch (action) {
          case "ownerListEvents":
            return NextResponse.json(await backend.ownerListEvents(owner));
          case "ownerCreateEvent":
            return NextResponse.json(
              await backend.ownerCreateEvent(
                {
                  name: String(body.name || ""),
                  slug: typeof body.slug === "string" ? body.slug : undefined,
                  type: typeof body.type === "string" ? body.type : undefined,
                  date: typeof body.date === "string" ? body.date : undefined,
                  venue: typeof body.venue === "string" ? body.venue : undefined,
                  tagline: typeof body.tagline === "string" ? body.tagline : undefined,
                },
                owner
              )
            );
          case "ownerGetStats":
            return NextResponse.json(await backend.ownerGetStats(slug, owner));
          case "ownerListGuests":
          case "ownerListGuestsEngagement":
            return NextResponse.json(await backend.ownerListGuestsEngagement(slug, owner));
          case "ownerListBlessings":
            return NextResponse.json(await backend.ownerListBlessings(slug, owner));
          case "ownerListPhotos":
            return NextResponse.json(await backend.ownerListPhotos(slug, owner));
          case "ownerListActivity":
            return NextResponse.json(await backend.ownerListActivity(slug, owner));
          case "ownerGetRsvps":
            return NextResponse.json(await backend.ownerGetRsvps(slug, owner));
          case "ownerCreateGuest":
            return NextResponse.json(
              await backend.ownerCreateGuest(
                slug,
                String(body.name || ""),
                owner,
                {
                  phone: typeof body.phone === "string" ? body.phone : undefined,
                  email: typeof body.email === "string" ? body.email : undefined,
                }
              )
            );
          case "ownerGenerateMemoryBook":
            return NextResponse.json(await backend.ownerGenerateMemoryBook(slug, owner));
          case "ownerGetMemoryBook":
            return NextResponse.json(await backend.ownerGetMemoryBook(slug, owner));
          default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "שגיאה";
        if (message.includes("אין הרשאה") || message.includes("לא נמצא")) {
          return forbidden(message);
        }
        throw err;
      }
    }

    if (ADMIN_ACTIONS.has(action)) {
      if (!adminKey) return forbidden("אין הרשאה");
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
            await backend.createGuest(slug, String(body.name || ""), admin, {
              phone: typeof body.phone === "string" ? body.phone : undefined,
              email: typeof body.email === "string" ? body.email : undefined,
            })
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
              body.attending === "yes" || body.attending === "no" ? body.attending : "yes",
            guestsCount: Number(body.guestsCount) || 0,
            notes: typeof body.notes === "string" ? body.notes : undefined,
          };
          return NextResponse.json(await backend.submitRsvp(rsvp));
        }
        case "blessing":
          return NextResponse.json(
            await backend.submitBlessing(slug, guestId, String(body.message || ""), ctx)
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
              body.attending === "yes" || body.attending === "no" ? body.attending : "yes",
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
        case "markComplete":
          return NextResponse.json(
            await backend.markComplete({ guestId, eventId })
          );
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

import { NextResponse } from "next/server";
import { getEventsBackend } from "@/lib/backend";
import { getSession } from "@/lib/auth/session";
import { emitHermesEvent } from "@/lib/integrations/hermes";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIp,
  rateLimitKey,
} from "@/lib/rate-limit";
import type { BlessingPayload, RsvpPayload } from "@/types/events";

const OWNER_ACTIONS = new Set([
  "ownerListEvents",
  "ownerCreateEvent",
  "ownerGetStats",
  "ownerListGuests",
  "ownerListBlessings",
  "ownerListPhotos",
]);

const PUBLIC_ACTIONS = new Set([
  "getEvent",
  "submitRsvp",
  "addBlessing",
  "uploadPhotos",
  "listPhotos",
]);

type Action = keyof typeof RATE_LIMITS | string;

function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "יותר מדי בקשות — נסו שוב בעוד כמה דקות" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

function applyRateLimit(action: Action, ip: string, accessToken?: string) {
  const rule = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
  if (!rule) return null;
  const result = checkRateLimit({
    key: rateLimitKey(ip, action, accessToken),
    limit: rule.limit,
    windowMs: rule.windowMs,
  });
  if (!result.ok) return rateLimitResponse(result.retryAfterSec);
  return null;
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

    const limited = applyRateLimit(action, ip, accessToken);
    if (limited) return limited;

    const backend = getEventsBackend();
    const slug = String(body.slug || "");

    if (PUBLIC_ACTIONS.has(action) && !adminKey) {
      if (!accessToken) {
        return NextResponse.json({ error: "נדרש קוד גישה לאירוע" }, { status: 403 });
      }
      const access = { accessToken };
      switch (action) {
        case "getEvent":
          return NextResponse.json(await backend.getEvent(slug, access));
        case "submitRsvp": {
          const { action: _a, accessToken: _t, ...rsvp } = body;
          const result = await backend.submitRsvp(rsvp as unknown as RsvpPayload, access);
          emitHermesEvent("rsvp.submitted", slug, {
            name: rsvp.name,
            status: rsvp.status,
            guestsCount: rsvp.guestsCount,
            guestId: result.guestId,
          });
          return NextResponse.json(result);
        }
        case "addBlessing": {
          const { action: _a, accessToken: _t, ...blessing } = body;
          const result = await backend.addBlessing(blessing as unknown as BlessingPayload, access);
          emitHermesEvent("blessing.added", slug, {
            guestName: blessing.guestName,
            message: blessing.message,
            blessingId: result.blessingId,
          });
          return NextResponse.json(result);
        }
        case "uploadPhotos": {
          const files = (body.files as { name: string; mimeType: string; dataBase64: string }[]) || [];
          const result = await backend.uploadPhotos(
            slug,
            files,
            access,
            typeof body.uploadedBy === "string" ? body.uploadedBy : undefined
          );
          emitHermesEvent("photos.uploaded", slug, {
            count: files.length,
            uploadedBy: body.uploadedBy || "",
            photoIds: result.photoIds,
          });
          return NextResponse.json(result);
        }
        case "listPhotos":
          return NextResponse.json(await backend.listPhotos(slug, access));
        default:
          break;
      }
    }

    if (OWNER_ACTIONS.has(action)) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
      }
      const owner = { tenantId: session.userId };
      switch (action) {
        case "ownerListEvents":
          return NextResponse.json(await backend.ownerListEvents(owner));
        case "ownerCreateEvent": {
          const { action: _a, ...payload } = body;
          const result = await backend.ownerCreateEvent(
            payload as Parameters<typeof backend.ownerCreateEvent>[0],
            owner
          );
          emitHermesEvent("event.created", String(result.slug), {
            eventId: result.eventId,
            tenantId: session.userId,
          });
          return NextResponse.json(result);
        }
        case "ownerGetStats":
          return NextResponse.json(await backend.ownerGetStats(slug, owner));
        case "ownerListGuests":
          return NextResponse.json(await backend.ownerListGuests(slug, owner));
        case "ownerListBlessings":
          return NextResponse.json(await backend.ownerListBlessings(slug, owner));
        case "ownerListPhotos":
          return NextResponse.json(await backend.ownerListPhotos(slug, owner));
        default:
          return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
      }
    }

    if (!adminKey) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const admin = { adminKey };
    switch (action) {
      case "adminPing":
        return NextResponse.json(await backend.adminPing(admin));
      case "listEvents":
        return NextResponse.json(await backend.listEvents(admin));
      case "getStats":
        return NextResponse.json(await backend.getStats(slug, admin));
      case "listGuests":
        return NextResponse.json(await backend.listGuests(slug, admin));
      case "listBlessings":
        return NextResponse.json(await backend.listBlessings(slug, admin));
      case "listPhotos":
        return NextResponse.json(await backend.listPhotosAdmin(slug, admin));
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    const status = message.includes("אין הרשאה") || message.includes("קוד גישה") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

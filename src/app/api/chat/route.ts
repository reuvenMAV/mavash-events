import { NextResponse } from "next/server";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIp,
  rateLimitKey,
} from "@/lib/rate-limit";

const WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL?.trim();
const WEBHOOK_KEY = process.env.N8N_CHAT_WEBHOOK_KEY?.trim();

export async function POST(request: Request) {
  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { error: "הצ'אט לא מוגדר בשרת (חסר N8N_CHAT_WEBHOOK_URL)" },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  const limited = checkRateLimit({
    key: rateLimitKey(ip, "chatMessage"),
    limit: RATE_LIMITS.chatMessage?.limit ?? 30,
    windowMs: RATE_LIMITS.chatMessage?.windowMs ?? 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "יותר מדי הודעות — נסו שוב בעוד דקה" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (WEBHOOK_KEY) headers["x-hermes-key"] = WEBHOOK_KEY;

    const upstream = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: body.sessionId,
        chatInput: body.chatInput,
        metadata: body.metadata,
      }),
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch {
    return NextResponse.json({ error: "שגיאת חיבור לבוט" }, { status: 502 });
  }
}

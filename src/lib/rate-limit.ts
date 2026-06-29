/**
 * In-memory rate limiter (per Vercel instance).
 * For production at scale, replace with Vercel KV / Upstash Redis.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

export function checkRateLimit(rule: RateLimitRule): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = store.get(rule.key);

  if (!existing || now >= existing.resetAt) {
    store.set(rule.key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true };
  }

  if (existing.count >= rule.limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { ok: true };
}

/** Action-specific limits — tune per abuse profile */
export const RATE_LIMITS = {
  submitRsvp: { limit: 12, windowMs: 60 * 60 * 1000 },
  addBlessing: { limit: 20, windowMs: 60 * 60 * 1000 },
  uploadPhotos: { limit: 8, windowMs: 60 * 60 * 1000 },
  getEvent: { limit: 120, windowMs: 60 * 1000 },
  chatMessage: { limit: 30, windowMs: 60 * 1000 },
} as const;

export function rateLimitKey(ip: string, action: string, accessToken?: string) {
  const tokenPart = accessToken ? accessToken.slice(0, 16) : "anon";
  return `${ip}:${action}:${tokenPart}`;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

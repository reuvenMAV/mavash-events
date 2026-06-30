import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  getGoogleOAuthConfig,
} from "@/lib/google-oauth";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export async function GET(request: Request) {
  if (!getGoogleOAuthConfig()) {
    return NextResponse.json({ error: "Google Sign-In לא מוגדר" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const state = randomBytes(24).toString("hex");
  const next = safeNextPath(searchParams.get("next"));

  const response = NextResponse.redirect(buildGoogleAuthUrl(request, state));
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set(OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}

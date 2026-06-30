import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth/session";
import { gasRequest } from "@/lib/gas-server";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  getGoogleOAuthConfig,
} from "@/lib/google-oauth";
import { getSiteUrl } from "@/lib/site-url";

function redirectWithError(request: Request, message: string) {
  const url = new URL("/login", getSiteUrl(request));
  url.searchParams.set("error", message);
  const response = NextResponse.redirect(url);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}

export async function GET(request: Request) {
  if (!getGoogleOAuthConfig()) {
    return redirectWithError(request, "Google Sign-In לא מוגדר");
  }

  const { searchParams } = new URL(request.url);
  const oauthError = searchParams.get("error");
  if (oauthError) {
    return redirectWithError(request, "ההתחברות בוטלה");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const jar = await cookies();
  const savedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  const next = jar.get(OAUTH_NEXT_COOKIE)?.value || "/dashboard";

  if (!code || !state || !savedState || state !== savedState) {
    return redirectWithError(request, "אימות Google נכשל");
  }

  try {
    const profile = await exchangeGoogleCode(request, code);
    if (!profile.emailVerified) {
      return redirectWithError(request, "אימייל Google לא מאומת");
    }

    const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
    if (!internalSecret) {
      return redirectWithError(request, "שרת לא מוגדר");
    }

    const user = await gasRequest<{
      userId: string;
      email: string;
      plan: string;
    }>("getOrCreateOAuthUser", {
      email: profile.email,
      provider: "google",
      internalSecret,
    });

    await setSession({
      userId: user.userId,
      email: user.email,
      plan: user.plan || "free",
    });

    const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    const response = NextResponse.redirect(new URL(dest, getSiteUrl(request)));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_NEXT_COOKIE);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה";
    return redirectWithError(request, message);
  }
}

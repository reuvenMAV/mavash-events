import { createRemoteJWKSet, jwtVerify } from "jose";
import { getSiteUrl } from "@/lib/site-url";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const OAUTH_STATE_COOKIE = "google-oauth-state";
export const OAUTH_NEXT_COOKIE = "google-oauth-next";

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

export function isGoogleAuthEnabled() {
  return Boolean(getGoogleOAuthConfig());
}

export function buildGoogleAuthUrl(request: Request, state: string): string {
  const { clientId } = getGoogleOAuthConfig()!;
  const redirectUri = `${getSiteUrl(request)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  request: Request,
  code: string
): Promise<{ email: string; emailVerified: boolean; name?: string }> {
  const { clientId, clientSecret } = getGoogleOAuthConfig()!;
  const redirectUri = `${getSiteUrl(request)}/api/auth/google/callback`;

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenData.id_token) {
    throw new Error(tokenData.error_description || tokenData.error || "Google token exchange failed");
  }

  const { payload } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  const email = String(payload.email || "").trim().toLowerCase();
  const emailVerified = payload.email_verified === true;
  const name = typeof payload.name === "string" ? payload.name : undefined;

  if (!email) {
    throw new Error("לא התקבל אימייל מ-Google");
  }

  return { email, emailVerified, name };
}

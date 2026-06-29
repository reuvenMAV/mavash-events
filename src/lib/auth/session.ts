import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "mavash-session";

export type SessionUser = {
  userId: string;
  email: string;
  plan: string;
};

function secretKey() {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) {
    throw new Error("חסר AUTH_SECRET");
  }
  return new TextEncoder().encode(raw);
}

export async function setSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = String(payload.userId || "");
    const email = String(payload.email || "");
    if (!userId || !email) return null;
    return {
      userId,
      email,
      plan: String(payload.plan || "free"),
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

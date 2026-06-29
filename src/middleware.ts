import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "mavash-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/dashboard") {
    return NextResponse.next();
  }
  if (pathname.startsWith("/dashboard/")) {
    if (!request.cookies.get(COOKIE_NAME)?.value) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

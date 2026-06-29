import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Dashboard handles its own auth UI — no redirect to /admin */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

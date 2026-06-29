import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { gasRequest } from "@/lib/gas-server";
import { setSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || password.length < 8) {
      return NextResponse.json(
        { error: "אימייל תקין וסיסמה (8 תווים לפחות) נדרשים" },
        { status: 400 }
      );
    }

    const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
    if (!internalSecret) {
      return NextResponse.json({ error: "שרת לא מוגדר" }, { status: 500 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await gasRequest<{ userId: string; email: string; plan: string }>(
      "createUser",
      { email, passwordHash, internalSecret }
    );

    await setSession({
      userId: created.userId,
      email: created.email,
      plan: created.plan || "free",
    });

    return NextResponse.json({ ok: true, userId: created.userId, email: created.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה";
    const status = message.includes("כבר קיים") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

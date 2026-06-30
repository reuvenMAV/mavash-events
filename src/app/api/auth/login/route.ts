import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { gasRequest } from "@/lib/gas-server";
import { setSession } from "@/lib/auth/session";

type GasUser = {
  user: {
    userId: string;
    email: string;
    passwordHash: string;
    plan: string;
  } | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json({ error: "חסר אימייל או סיסמה" }, { status: 400 });
    }

    const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
    if (!internalSecret) {
      return NextResponse.json({ error: "שרת לא מוגדר" }, { status: 500 });
    }

    const { user } = await gasRequest<GasUser>("getUserByEmail", {
      email,
      internalSecret,
    });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
    }

    if (user.passwordHash.startsWith("oauth:")) {
      return NextResponse.json(
        { error: "חשבון זה מחובר ל-Google — התחברו עם Google" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
    }

    await setSession({
      userId: user.userId,
      email: user.email,
      plan: user.plan || "free",
    });

    return NextResponse.json({ ok: true, userId: user.userId, email: user.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

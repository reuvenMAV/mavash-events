import { redirect } from "next/navigation";
import Link from "next/link";
import { getDemoHref } from "@/lib/demo";

export const metadata = { title: "דוגמה | MAVASH Events" };

export default function DemoPage() {
  const href = getDemoHref();
  if (href) redirect(href);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-4xl">🎉</p>
      <h1 className="mt-4 font-heading text-2xl">דוגמת אירוע</h1>
      <p className="mt-2 max-w-sm text-sm text-charcoal/60">
        חסר טוקן דמו בשרת. הגדר <code dir="ltr">DEMO_EVENT_TOKEN</code> ב-Vercel (או{" "}
        <code dir="ltr">NEXT_PUBLIC_DEMO_EVENT_TOKEN</code>).
      </p>
      <Link href="/" className="mt-6 text-sm underline text-charcoal/50">
        חזרה לדף הבית
      </Link>
    </main>
  );
}

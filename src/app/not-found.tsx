import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">404</p>
      <h1 className="mt-4 font-heading text-2xl">הדף לא נמצא</h1>
      <p className="mt-3 text-sm text-charcoal/70">
        ייתכן שהקישור שגוי. דפי אירוע מתחילים ב־<code dir="ltr">/e/שם-אירוע?t=טוקן</code>
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/" className="rounded-full bg-charcoal px-6 py-3 text-cream">
          דף הבית
        </Link>
        <Link href="/dashboard" className="rounded-full border border-charcoal/20 px-6 py-3">
          דשבורד מנהלים
        </Link>
      </div>
    </main>
  );
}

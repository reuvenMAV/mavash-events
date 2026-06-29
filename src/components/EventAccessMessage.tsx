import Link from "next/link";

export function MissingAccessToken({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">🔐</p>
        <h1 className="mt-4 font-heading text-2xl">נדרש קישור הזמנה</h1>
        <p className="mt-3 text-sm text-charcoal/70">
          כדי לגשת לאירוע צריך את הקישור האישי מההזמנה (פרמטר <code dir="ltr">?t=...</code>).
        </p>
        <p className="mt-2 text-xs text-charcoal/50" dir="ltr">
          /e/{slug}?t=YOUR_TOKEN
        </p>
      </div>
    </div>
  );
}

export function InvalidAccessToken() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">⛔</p>
        <h1 className="mt-4 font-heading text-2xl">קוד גישה לא תקין</h1>
        <p className="mt-3 text-sm text-charcoal/70">
          הקישור שברשותכם אינו תקף לאירוע זה. בדקו את ההזמנה או פנו למארגנים.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-gold underline">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}

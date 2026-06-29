"use client";

import Link from "next/link";

export function DashboardLayout({
  slug,
  active,
  children,
}: {
  slug: string;
  active: "overview" | "guests" | "blessings" | "gallery";
  children: React.ReactNode;
}) {
  const tabs = [
    { id: "overview" as const, href: `/dashboard/${slug}`, label: "סקירה" },
    { id: "guests" as const, href: `/dashboard/${slug}/guests`, label: "מוזמנים" },
    { id: "blessings" as const, href: `/dashboard/${slug}/blessings`, label: "ברכות" },
    { id: "gallery" as const, href: `/dashboard/${slug}/gallery`, label: "גלריה" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-charcoal/10 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/dashboard" className="font-heading text-lg">
            MAVASH Events
          </Link>
          <Link href={`/e/${slug}`} className="text-sm text-charcoal/60 hover:text-charcoal">
            צפייה באתר →
          </Link>
        </div>
        <nav className="mx-auto mt-4 flex max-w-4xl gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                active === t.id ? "bg-charcoal text-cream" : "bg-charcoal/5 text-charcoal/70"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}

import Link from "next/link";
export const dynamic = "force-dynamic";

import { EventShell } from "@/components/EventShell";
import { InvalidAccessToken, MissingAccessToken } from "@/components/EventAccessMessage";
import { loadEventForGuest } from "@/lib/load-event";

function tokenQuery(accessToken: string) {
  return `?t=${encodeURIComponent(accessToken)}`;
}

export default async function EventHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;
  const loaded = await loadEventForGuest(slug, t);

  if (!loaded.ok) {
    if (loaded.reason === "missing_token") return <MissingAccessToken slug={slug} />;
    return <InvalidAccessToken />;
  }

  const { event } = loaded;
  const q = tokenQuery(t!);

  return (
    <EventShell event={event} accessToken={t!}>
      <div className="space-y-4">
        <p className="text-center text-charcoal/70">בחרו מה תרצו לעשות:</p>
        <div className="grid gap-3">
          <ActionCard href={`/e/${slug}/rsvp${q}`} emoji="✅" title="אישור הגעה" desc="ספרו לנו אם תגיעו וכמה אורחים" />
          <ActionCard href={`/e/${slug}/blessings${q}`} emoji="💌" title="ברכה" desc="כתבו מילים חמות לספר הברכות" />
          <ActionCard href={`/e/${slug}/photos${q}`} emoji="📸" title="תמונות" desc="העלו תמונות מהאירוע" />
        </div>
      </div>
    </EventShell>
  );
}

function ActionCard({
  href,
  emoji,
  title,
  desc,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <span className="text-3xl">{emoji}</span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-charcoal/60">{desc}</p>
      </div>
    </Link>
  );
}

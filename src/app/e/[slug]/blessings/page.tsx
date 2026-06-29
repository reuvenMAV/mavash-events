export const dynamic = "force-dynamic";

import { EventShell } from "@/components/EventShell";
import { InvalidAccessToken, MissingAccessToken } from "@/components/EventAccessMessage";
import { BlessingForm } from "@/components/BlessingForm";
import { loadEventForGuest } from "@/lib/load-event";

export default async function BlessingsPage({
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

  return (
    <EventShell event={loaded.event} accessToken={t!}>
      <BlessingForm slug={slug} accessToken={t!} />
    </EventShell>
  );
}

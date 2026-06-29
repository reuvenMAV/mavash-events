export const dynamic = "force-dynamic";

import { EventShell } from "@/components/EventShell";
import { InvalidAccessToken, MissingAccessToken } from "@/components/EventAccessMessage";
import { PhotoUpload } from "@/components/PhotoUpload";
import { loadEventForGuest } from "@/lib/load-event";

export default async function PhotosPage({
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
      <PhotoUpload slug={slug} accessToken={t!} />
    </EventShell>
  );
}

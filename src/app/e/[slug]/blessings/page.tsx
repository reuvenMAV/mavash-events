import { redirect } from "next/navigation";

export default async function LegacyBlessingsRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;
  redirect(t ? `/e/${slug}?t=${encodeURIComponent(t)}` : `/e/${slug}`);
}

"use client";

import { OwnerEventDashboard } from "@/components/OwnerEventDashboard";
import { useParams } from "next/navigation";

export default function DashboardEventPage() {
  const { slug } = useParams<{ slug: string }>();
  return <OwnerEventDashboard slug={slug} />;
}

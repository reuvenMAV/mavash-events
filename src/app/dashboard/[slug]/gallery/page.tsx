"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ownerPhotos } from "@/lib/events-api";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { PhotoRecord } from "@/types/events";

export default function DashboardGalleryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/dashboard";
          return null;
        }
        return ownerPhotos(slug);
      })
      .then((d) => {
        if (d) setPhotos(d.photos);
      });
  }, [slug]);

  return (
    <DashboardLayout slug={slug} active="gallery">
      <h2 className="font-heading text-2xl font-light">גלריה</h2>
      <p className="mt-1 text-sm text-charcoal/50">{photos.length} תמונות</p>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((p) => (
          <a
            key={p.photoId}
            href={p.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square overflow-hidden rounded-xl bg-charcoal/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://drive.google.com/thumbnail?id=${p.driveFileId}&sz=w400`}
              alt={p.fileName}
              className="h-full w-full object-cover"
            />
          </a>
        ))}
      </div>
      {photos.length === 0 && (
        <p className="mt-8 text-center text-charcoal/50">עדיין אין תמונות</p>
      )}
    </DashboardLayout>
  );
}

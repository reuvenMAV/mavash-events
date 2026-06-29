"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppFloat({ whatsapp }: { whatsapp: string }) {
  const message = encodeURIComponent(
    "היי! מעוניין/ת ב-MAVASH Events — פלטפורמה לאירועים (RSVP, ברכות, תמונות). אשמח לפרטים."
  );

  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
      aria-label="וואטסאפ"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

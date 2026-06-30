"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { defaultChatConfig, whatsappNumber } from "@/lib/chat-config";

export function SiteAssist() {
  const pathname = usePathname() || "";
  const eventSlugMatch = pathname.match(/^\/e\/([^/]+)/);
  const eventIdMatch = pathname.match(/^\/event\/([^/]+)/);
  const eventSlug = eventSlugMatch?.[1];
  const eventId = eventIdMatch?.[1];

  const chatConfig = {
    ...defaultChatConfig,
    initialMessage:
      eventSlug || eventId
        ? `היי! 👋 שאלו אותי על האירוע — איך מאשרים הגעה (RSVP), שולחים ברכה, או מעלים תמונות.`
        : defaultChatConfig.initialMessage,
    subtitle:
      eventSlug || eventId ? "עוזר לאורחי האירוע" : defaultChatConfig.subtitle,
  };

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return null;

  return (
    <>
      <ChatWidget
        config={chatConfig}
        context={{
          brand: "MAVASH Events",
          eventSlug,
          eventId,
          source: eventSlug
            ? `אירוע /e/${eventSlug}`
            : eventId
              ? `אירוע /event/${eventId}`
              : "אתר — MAVASH Events",
        }}
      />
      <WhatsAppFloat whatsapp={whatsappNumber} />
    </>
  );
}

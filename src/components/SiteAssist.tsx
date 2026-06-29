"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { defaultChatConfig, whatsappNumber } from "@/lib/chat-config";

export function SiteAssist() {
  const pathname = usePathname() || "";
  const eventMatch = pathname.match(/^\/e\/([^/]+)/);
  const eventSlug = eventMatch?.[1];

  const chatConfig = {
    ...defaultChatConfig,
    initialMessage: eventSlug
      ? `היי! 👋 שאלו אותי על האירוע — איך מאשרים הגעה (RSVP), שולחים ברכה, או מעלים תמונות. הקישור שלכם כבר מזהה אתכם.`
      : defaultChatConfig.initialMessage,
    subtitle: eventSlug ? "עוזר לאורחי האירוע" : defaultChatConfig.subtitle,
  };

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <>
      <ChatWidget
        config={chatConfig}
        context={{
          brand: "MAVASH Events",
          eventSlug,
          source: eventSlug ? `אירוע /e/${eventSlug}` : "אתר — MAVASH Events",
        }}
      />
      <WhatsAppFloat whatsapp={whatsappNumber} />
    </>
  );
}

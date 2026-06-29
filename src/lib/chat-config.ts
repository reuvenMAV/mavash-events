export type ChatConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  placeholder: string;
  initialMessage: string;
  launcherLabel: string;
  avatarUrl?: string;
};

export const defaultChatConfig: ChatConfig = {
  enabled: true,
  title: "MAVASH Events",
  subtitle: "יועץ דיגיטלי — אירועים, RSVP וברכות",
  placeholder: "שאלו על יצירת אירוע, הזמנות, ברכות...",
  initialMessage:
    "היי! 👋 אני העוזר של MAVASH Events. רוצים לפתוח אירוע (בר מצווה, חתונה, ברית)? אשמח להסביר איך זה עובד — RSVP, ספר ברכות ושיתוף תמונות.",
  launcherLabel: "צ'אט עם יועץ",
  avatarUrl: "/chat/assistant-avatar.png",
};

export const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "972544223911";

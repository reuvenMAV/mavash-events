export type EventInfo = {
  eventId: string;
  slug: string;
  name: string;
  type: string;
  date: string;
  venue: string;
  tagline: string;
  theme?: { primary?: string; accent?: string; background?: string };
};

export type RsvpInput = {
  slug?: string;
  name: string;
  phone?: string;
  attending: "yes" | "no";
  guestsCount?: number;
  notes?: string;
  guestId?: string;
  eventId?: string;
};

export type RsvpResult = {
  success: boolean;
  guestId: string;
  rsvpId: string;
  attending: string;
};

export type RsvpRow = {
  rsvpId: string;
  guestId: string;
  name: string;
  phone: string;
  attending: string;
  guestsCount: number;
  notes: string;
  createdAt: string;
};

export type BlessingRow = {
  blessingId: string;
  guestId: string;
  guestName: string;
  message: string;
  createdAt: string;
};

export type PhotoRow = {
  photoId: string;
  guestId: string;
  fileName: string;
  driveFileId: string;
  driveUrl: string;
  createdAt: string;
};

export type GuestSession = {
  guestId: string;
  rsvpId: string;
  name: string;
  attending: "yes" | "no";
};

export type GuestEngagement = "not_opened" | "opened" | "rsvp" | "completed";

export type GuestEngagementRow = {
  guestId: string;
  name: string;
  phone: string;
  email: string;
  inviteUrl: string;
  qrUrl: string;
  openCount: number;
  firstOpenedAt: string;
  lastOpenedAt: string;
  engagement: GuestEngagement;
  hasRsvp: boolean;
  attending: string;
  reminders: { type: string; sent: boolean; at: string }[];
};

export type ActivityRow = {
  logId: string;
  timestamp: string;
  guestId: string;
  guestName: string;
  actionType: string;
  metadata: Record<string, unknown>;
};

export type ReminderRow = {
  reminderId: string;
  guestId: string;
  guestName: string;
  reminderType: string;
  reminderSent: boolean;
  reminderTimestamp: string;
  channel: string;
};

export type MemoryBook = {
  docUrl: string;
  pdfUrl: string;
  createdAt?: string;
  existing?: boolean;
  success?: boolean;
};

export type GuestInviteContext = {
  eventId: string;
  guestId: string;
  mode: "guest";
};

export type TokenContext = {
  slug: string;
  accessToken: string;
  mode: "token";
};

export type FlowContext = GuestInviteContext | TokenContext;

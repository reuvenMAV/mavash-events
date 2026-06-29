export type EventType =
  | "bar_mitzvah"
  | "bat_mitzvah"
  | "wedding"
  | "birthday"
  | "brit"
  | "corporate"
  | "other";

export type GuestStatus = "pending" | "yes" | "no";

export interface EventRecord {
  eventId: string;
  tenantId?: string;
  slug: string;
  name: string;
  type: EventType;
  date: string;
  venue: string;
  tagline?: string;
  theme?: EventTheme;
  active: boolean;
}

export interface EventTheme {
  primary: string;
  accent: string;
  background: string;
}

export interface GuestRecord {
  guestId: string;
  eventId: string;
  name: string;
  phone?: string;
  status: GuestStatus;
  guestsCount: number;
  notes?: string;
  inviteToken?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface BlessingRecord {
  blessingId: string;
  eventId: string;
  guestName: string;
  message: string;
  createdAt: string;
}

export interface PhotoRecord {
  photoId: string;
  eventId: string;
  fileName: string;
  driveFileId: string;
  driveUrl: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface EventStats {
  guestsTotal: number;
  confirmed: number;
  declined: number;
  pending: number;
  guestsAttending: number;
  blessingsCount: number;
  photosCount: number;
}

export interface RsvpPayload {
  slug: string;
  name: string;
  phone?: string;
  attending: "yes" | "no";
  guestsCount: number;
  notes?: string;
}

export interface BlessingPayload {
  slug: string;
  guestName: string;
  message: string;
}

export interface PhotoUploadPayload {
  slug: string;
  uploadedBy?: string;
  files: { name: string; mimeType: string; dataBase64: string }[];
}

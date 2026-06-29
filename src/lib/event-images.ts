/** Phase 2 marketing & UX imagery — public/images */
export const EVENT_IMAGES = {
  hero: "/images/hero-invitation.png",
  qr: "/images/screen-qr-invitation.png",
  rsvp: "/images/screen-rsvp.png",
  blessings: "/images/screen-blessings.png",
  photos: "/images/screen-photos.png",
  timeline: "/images/screen-timeline.png",
  memoryBook: "/images/screen-memory-book.png",
} as const;

export const FLOW_STEP_IMAGE: Record<string, string> = {
  rsvp: EVENT_IMAGES.rsvp,
  thanks: EVENT_IMAGES.hero,
  blessing: EVENT_IMAGES.blessings,
  photos: EVENT_IMAGES.photos,
  done: EVENT_IMAGES.memoryBook,
};

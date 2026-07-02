import { GasEventsBackend } from "./gas-adapter";
import { HybridEventsBackend } from "./hybrid-adapter";
import type { EventsBackend } from "./types";

let singleton: EventsBackend | null = null;

/**
 * Backend factory — swap implementation via EVENTS_BACKEND env (future: firestore).
 * UI must only use events-api.ts → /api/events → getEventsBackend().
 *
 * Default: hybrid (GAS for guests; owner events stay on GAS until OWNER_EVENTS_SOURCE=supabase).
 */
export function getEventsBackend(): EventsBackend {
  if (singleton) return singleton;

  const kind = process.env.EVENTS_BACKEND?.trim() || "hybrid";

  switch (kind) {
    case "gas":
      singleton = new GasEventsBackend();
      break;
    case "hybrid":
      singleton = new HybridEventsBackend();
      break;
    // case "supabase":
    //   singleton = new FullSupabaseEventsBackend();
    //   break;
    default:
      throw new Error(`Unknown EVENTS_BACKEND: ${kind}`);
  }

  return singleton;
}

export type { EventsBackend, AccessContext, AdminContext } from "./types";

import { GasEventsBackend } from "./gas-adapter";
import type { EventsBackend } from "./types";

let singleton: EventsBackend | null = null;

/**
 * Backend factory — swap implementation via EVENTS_BACKEND env (future: firestore).
 * UI must only use events-api.ts → /api/events → getEventsBackend().
 */
export function getEventsBackend(): EventsBackend {
  if (singleton) return singleton;

  const kind = process.env.EVENTS_BACKEND?.trim() || "gas";

  switch (kind) {
    case "gas":
      singleton = new GasEventsBackend();
      break;
    // case "sheets-hybrid":
    //   singleton = new SheetsHybridBackend(); // admin reads via googleapis — see sheets-direct.ts
    //   break;
    // case "firestore":
    //   singleton = new FirestoreEventsBackend();
    //   break;
    default:
      throw new Error(`Unknown EVENTS_BACKEND: ${kind}`);
  }

  return singleton;
}

export type { EventsBackend, AccessContext, AdminContext } from "./types";

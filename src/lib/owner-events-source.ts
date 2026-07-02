/**
 * Owner events data source.
 * Default: gas — zero change until Supabase is configured and explicitly enabled.
 *
 * OWNER_EVENTS_SOURCE:
 *   gas       — GAS only (default)
 *   supabase  — Supabase for owner CRUD + dual-write to GAS on create
 *   auto      — supabase when SUPABASE_* env vars exist, else gas
 */
export type OwnerEventsSource = "gas" | "supabase";

export function resolveOwnerEventsSource(): OwnerEventsSource {
  const raw = process.env.OWNER_EVENTS_SOURCE?.trim().toLowerCase();

  if (raw === "supabase") return "supabase";
  if (raw === "auto") {
    const hasSupabase = Boolean(
      process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    );
    return hasSupabase ? "supabase" : "gas";
  }

  return "gas";
}

export function useSupabaseForOwnerEvents() {
  return resolveOwnerEventsSource() === "supabase";
}

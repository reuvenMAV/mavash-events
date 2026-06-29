/**
 * Optional direct Google Sheets access (hybrid backend).
 *
 * Pattern from raouben-site/src/lib/sheets.ts:
 * - Service account with spreadsheets scope
 * - Read/write via googleapis when GOOGLE_* env vars are set
 * - Fall back to GAS adapter when not configured
 *
 * Use for admin reads (guest list, stats) or cron jobs in n8n — not required for MVP.
 * Set EVENTS_BACKEND=gas (default) until Sheets adapter is implemented.
 *
 * @see docs/INTEGRATIONS.md#google-sheets-direct
 */

export function hasSheetsCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
      process.env.GOOGLE_PRIVATE_KEY?.trim() &&
      process.env.SPREADSHEET_ID?.trim()
  );
}

export function sheetsHybridEnabled(): boolean {
  return process.env.EVENTS_BACKEND?.trim() === "sheets-hybrid" && hasSheetsCredentials();
}

const GAS_URL = process.env.GAS_WEB_APP_URL?.trim();

/**
 * Low-level GAS HTTP client — use only from src/lib/backend/gas-adapter.ts.
 * Apps Script Web Apps do not receive custom headers reliably; adminKey goes in the JSON body.
 */

export function hasGasBackend() {
  return Boolean(GAS_URL);
}

export async function gasRequest<T>(
  action: string,
  payload: object = {},
  adminKey?: string
): Promise<T> {
  if (!GAS_URL) {
    throw new Error("חסר GAS_WEB_APP_URL — ראה docs/SETUP.md");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (adminKey) {
    headers["x-admin-key"] = adminKey;
  }

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action,
      ...(adminKey ? { adminKey } : {}),
      ...payload,
    }),
    cache: "no-store",
  });

  const data = (await res.json()) as { success?: boolean; error?: string } & T;
  if (!res.ok || data.error) {
    throw new Error(data.error || `שגיאת שרת (${res.status})`);
  }
  return data;
}

export async function gasGet<T>(
  action: string,
  params: Record<string, string> = {}
): Promise<T> {
  if (!GAS_URL) {
    throw new Error("חסר GAS_WEB_APP_URL");
  }
  const url = new URL(GAS_URL);
  url.searchParams.set("api", action);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as { error?: string } & T;
  if (!res.ok || data.error) {
    throw new Error(data.error || `שגיאת שרת (${res.status})`);
  }
  return data;
}

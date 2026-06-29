/** Server-only bridge to GAS with tenant scoping */
export function internalGasPayload(tenantId: string) {
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  if (!internalSecret) {
    throw new Error("חסר INTERNAL_API_SECRET");
  }
  return { tenantId, internalSecret };
}

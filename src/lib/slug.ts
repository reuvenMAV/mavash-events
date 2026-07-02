/** Slug generation aligned with Apps Script slugify_/uniqueSlug_ behavior. */

export function slugify(text: string): string {
  const base = String(text || "event")
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0590-\u05FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "event").substring(0, 36);
}

export function uniqueSlug(base: string, existing: string[]): string {
  let slug = slugify(base);
  if (!existing.includes(slug)) return slug;
  let i = 2;
  while (existing.includes(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

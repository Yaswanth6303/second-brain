export const normTag = (t: string) => t.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");

// Adds comma- or Enter-separated tags, keeping at most 8, like the prototype's tag box.
export function addTags(tags: string[], raw: string): string[] {
  const next = [...tags];
  for (const t of raw.split(",").map(normTag).filter(Boolean))
    if (!next.includes(t) && next.length < 8) next.push(t);
  return next;
}

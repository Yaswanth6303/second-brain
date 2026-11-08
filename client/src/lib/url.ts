// Link helpers ported from the prototype (second-brain-bootstrap.html).

export function normUrl(v: string): string | null {
  v = (v || "").trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : "https://" + v);
    return u.hostname.includes(".") ? u.href : null;
  } catch {
    return null;
  }
}

export const bare = (u: string) =>
  u
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/\/$/, "")
    .toLowerCase();

export function domain(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export type BuiltinType = "article" | "video" | "podcast" | "course" | "tool";

export function detectType(u: string): BuiltinType {
  const s = u.toLowerCase();
  if (/youtube\.com|youtu\.be|vimeo\.com|ted\.com\/talks|twitch\.tv/.test(s)) return "video";
  if (/spotify\.com|podcasts\.apple|podcast|acquired\.fm|overcast\.fm|pca\.st/.test(s))
    return "podcast";
  if (/coursera|udemy|edx\.org|varsity|khanacademy|\/course/.test(s)) return "course";
  if (/github\.com|gitlab\.com|\/docs|figma\.com|npmjs\.com/.test(s)) return "tool";
  return "article";
}

export function guessTitle(u: string): string {
  try {
    const seg = new URL(u).pathname.split("/").filter(Boolean).pop() || "";
    const t = decodeURIComponent(seg)
      .replace(/\.(html?|php|aspx?)$/i, "")
      .replace(/[-_+]+/g, " ")
      .trim();
    return /\s/.test(t) && t.length > 5 ? t[0]!.toUpperCase() + t.slice(1) : "";
  } catch {
    return "";
  }
}

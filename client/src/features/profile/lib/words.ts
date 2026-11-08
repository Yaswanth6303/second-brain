// "a", "a and b", "a, b and c".
export const listJoin = (a: string[]) =>
  a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;

export const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

export const CARD_HUES = [168, 212, 262, 330, 12, 38];

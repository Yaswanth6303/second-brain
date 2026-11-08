const HINTS = [
  "Too short",
  "Weak. Add a number and a capital letter.",
  "Fair. A symbol would help.",
  "Good",
  "Strong",
];

// Same scoring as the prototype's sign-up meter.
export function passwordStrength(p: string): { score: number; hint: string } {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^\w\s]/.test(p) || p.length >= 14) score++;
  if (!p) return { score, hint: "Use 8 or more characters with a number and a capital letter." };
  return { score, hint: HINTS[p.length < 8 ? 0 : score]! };
}

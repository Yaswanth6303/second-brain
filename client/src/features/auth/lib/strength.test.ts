import { describe, expect, it } from "vite-plus/test";
import { passwordStrength } from "./strength.ts";

describe("passwordStrength", () => {
  it.each([
    ["", 0, "Use 8 or more characters with a number and a capital letter."],
    ["abc", 0, "Too short"],
    ["abcdefgh", 1, "Weak. Add a number and a capital letter."],
    ["Abcdefgh", 2, "Fair. A symbol would help."],
    ["Abcdefgh1", 3, "Good"],
    ["Abcdefgh1!", 4, "Strong"],
  ])("%j → %i", (pw, score, hint) => {
    expect(passwordStrength(pw)).toEqual({ score, hint });
  });
});

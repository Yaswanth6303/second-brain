import { describe, expect, it } from "vite-plus/test";
import { bare, detectType, domain, guessTitle, normUrl } from "./url.ts";

describe("url helpers", () => {
  it.each([
    ["https://www.youtube.com/watch?v=x", "video"],
    ["https://open.spotify.com/show/1", "podcast"],
    ["https://www.coursera.org/learn/ml", "course"],
    ["https://github.com/vercel/next.js", "tool"],
    ["https://paulgraham.com/greatwork.html", "article"],
  ])("detectType(%s) = %s", (u, t) => expect(detectType(u)).toBe(t));

  it("normalises links", () => {
    expect(normUrl("example.com/x")).toBe("https://example.com/x");
    expect(normUrl("  http://a.io ")).toBe("http://a.io/");
    expect(normUrl("nope")).toBeNull();
    expect(normUrl("")).toBeNull();
  });

  it("compares and labels links", () => {
    expect(bare("https://www.Example.com/a/")).toBe("example.com/a");
    expect(domain("https://www.ted.com/talks/x")).toBe("ted.com");
  });

  it("guesses a title from the last path segment", () => {
    expect(guessTitle("https://a.com/how-to-do-great-work.html")).toBe("How to do great work");
    expect(guessTitle("https://a.com/x")).toBe("");
  });
});

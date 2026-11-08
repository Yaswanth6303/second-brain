import { describe, expect, it } from "vite-plus/test";
import { an, fmtMins, fromLocalInput, plural, rel, toLocalInput } from "./format.ts";

describe("format helpers", () => {
  it("formats minutes", () => {
    expect(fmtMins(45)).toBe("45 min");
    expect(fmtMins(60)).toBe("1 h");
    expect(fmtMins(90)).toBe("1 h 30 min");
  });

  it("describes how long ago", () => {
    const now = Date.parse("2026-11-08T12:00:00Z");
    const ago = (ms: number) => new Date(now - ms).toISOString();
    expect(rel(ago(10_000), now)).toBe("just now");
    expect(rel(ago(5 * 60e3), now)).toBe("5 min ago");
    expect(rel(ago(3 * 3600e3), now)).toBe("3 h ago");
    expect(rel(ago(26 * 3600e3), now)).toBe("yesterday");
    expect(rel(ago(5 * 86400e3), now)).toBe("5 days ago");
  });

  it("pluralises and picks an article", () => {
    expect(plural(1, "link")).toBe("1 link");
    expect(plural(3, "link")).toBe("3 links");
    expect(an("Article")).toBe("an article");
    expect(an("Video")).toBe("a video");
  });

  it("round-trips a local date-time input without shifting the hour", () => {
    const iso = fromLocalInput("2026-11-10T09:00")!;
    expect(toLocalInput(iso)).toBe("2026-11-10T09:00");
    expect(fromLocalInput("")).toBeNull();
    expect(toLocalInput(null)).toBe("");
  });
});

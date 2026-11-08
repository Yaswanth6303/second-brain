import type { CSSProperties } from "react";
import { fmtMins } from "../../../lib/format.ts";
import { domain } from "../../../lib/url.ts";
import type { Item, TypeDef } from "../types.ts";

// CSS variable for a link type's colour; custom types share one colour, as in the prototype.
export const typeColor = (t: TypeDef) =>
  ({ "--tc": `var(--color-t-${t.custom ? "custom" : t.key})` }) as CSSProperties;

export const dur = (mins: number, t: TypeDef) =>
  mins ? [fmtMins(mins), t.verb].filter(Boolean).join(" ") : "";

export const metaLine = (it: Item, t: TypeDef) =>
  [domain(it.url), dur(it.mins, t), it.coll].filter(Boolean).join(" · ");

import { type FormEvent, useRef, useState } from "react";
import { Button } from "../../../components/ui/Button.tsx";
import { an, rel } from "../../../lib/format.ts";
import { bare, detectType, domain, normUrl } from "../../../lib/url.ts";
import { BUILTIN_TYPES, type Item } from "../types.ts";
import { useItemForm } from "./ItemFormProvider.tsx";

const DEFAULT_HINT =
  "The type is detected from the address. You name it, tag it and choose who gets it before it is saved.";

function hintFor(v: string, items: Item[]) {
  if (!v.trim()) return DEFAULT_HINT;
  const u = normUrl(v);
  if (!u) return "That does not look like a full link yet.";
  const dup = items.find((i) => bare(i.url) === bare(u));
  if (dup)
    return (
      <>
        <span className="text-warn font-semibold">Already in your library:</span> {dup.title}, saved{" "}
        {rel(dup.savedAt)}.
      </>
    );
  return `Looks like ${an(BUILTIN_TYPES[detectType(u)]!.label)} from ${domain(u)}. Press Enter to name and tag it.`;
}

export function CaptureBar({ items, coll }: { items: Item[]; coll: string | null }) {
  const [value, setValue] = useState("");
  const [tried, setTried] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const form = useItemForm();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const u = normUrl(value);
    if (!u) {
      setTried(true);
      input.current?.focus();
      return;
    }
    form.openNew(u, { coll: coll ?? "", onSaved: () => setValue("") });
  }

  return (
    <>
      <form
        noValidate
        onSubmit={onSubmit}
        className="bg-surface border-ink flex items-center gap-2 rounded-[14px] border-[1.5px] py-1.5 pr-1.5 pl-3.5 shadow-[4px_4px_0_var(--color-mark)]"
      >
        <i className="bi bi-link-45deg text-muted text-xl" />
        <input
          ref={input}
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="Paste a link to an article, video or podcast"
          aria-label="Paste a link"
          aria-describedby="captureHint"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-ink min-w-0 flex-1 border-0 bg-transparent py-2 text-base outline-0"
        />
        <Button type="submit">Save link</Button>
      </form>
      <p id="captureHint" className="text-muted mx-0.5 mt-2.5 mb-0 min-h-[1.3em] text-[.84rem]">
        {hintFor(value || (tried ? "x" : ""), items)}
      </p>
    </>
  );
}

import { type KeyboardEvent, useId } from "react";
import { addTags } from "../lib/tags.ts";

type Props = {
  tags: string[];
  draft: string;
  suggestions: string[];
  onTags: (t: string[]) => void;
  onDraft: (d: string) => void;
};

export function TagInput({ tags, draft, suggestions, onTags, onDraft }: Props) {
  const id = useId();
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      onTags(addTags(tags, draft));
      onDraft("");
    } else if (e.key === "Backspace" && !draft && tags.length) onTags(tags.slice(0, -1));
  };
  const sug = suggestions.filter((t) => !tags.includes(t)).slice(0, 8);
  return (
    <div>
      <label className="label" htmlFor={id}>
        Tags
      </label>
      <div className="border-line bg-surface focus-within:border-brand focus-within:ring-brand/20 flex flex-wrap items-center gap-1.5 rounded-[.6rem] border px-2 py-1.5 focus-within:ring-[.2rem]">
        {tags.map((t) => (
          <span key={t} className="tag on">
            #{t}
            <button
              type="button"
              aria-label={`Remove tag ${t}`}
              onClick={() => onTags(tags.filter((x) => x !== t))}
            >
              <i className="bi bi-x" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          autoComplete="off"
          placeholder="Type a tag and press Enter"
          className="text-ink min-w-0 flex-[1_1_140px] border-0 bg-transparent p-0.5 outline-0"
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={onKey}
        />
      </div>
      {sug.length > 0 && (
        <div className="text-muted mt-2 flex flex-wrap items-center gap-1.5 text-[.78rem]">
          Used before:
          {sug.map((t) => (
            <button key={t} type="button" className="tag" onClick={() => onTags(addTags(tags, t))}>
              #{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

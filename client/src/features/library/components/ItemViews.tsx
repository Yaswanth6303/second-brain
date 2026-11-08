import { metaLine, typeColor } from "../lib/display.ts";
import type { Item, TypeDef } from "../types.ts";
import {
  ItemMenu,
  ShareButton,
  ShelfFavButtons,
  Stamps,
  StatusButton,
  Tags,
  TypeIcon,
} from "./bits.tsx";

type Props = { item: Item; t: TypeDef; tag: string | null; onTag: (t: string) => void };

export function ItemCard({ item, t, tag, onTag }: Props) {
  return (
    <article
      style={typeColor(t)}
      className="bg-surface border-line flex min-w-0 flex-col gap-2.5 rounded-[14px] border p-4 hover:border-[color-mix(in_srgb,var(--color-ink)_28%,var(--color-line))]"
    >
      <div className="flex min-h-[34px] min-w-0 items-center gap-2">
        <span className="chip">
          <i className={`bi ${t.icon}`} />
          {t.label}
        </span>
        <span className="ml-auto flex flex-none items-center">
          <ShelfFavButtons item={item} />
          <ItemMenu item={item} />
        </span>
      </div>
      <a className="item-title" href={item.url} target="_blank" rel="noopener noreferrer">
        {item.title}
      </a>
      <div className="meta">{metaLine(item, t)}</div>
      {item.note && <p className="note">{item.note}</p>}
      <Tags tags={item.tags} active={tag} onTag={onTag} />
      <div className="border-line mt-auto flex flex-col gap-2.5 border-t border-dashed pt-2.5">
        <Stamps item={item} />
        <div className="flex min-h-[34px] items-center">
          <StatusButton item={item} />
          <span className="ml-auto flex flex-none items-center gap-2">
            <ShareButton item={item} bordered />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ItemRow({ item, t, tag, onTag }: Props) {
  return (
    <li
      style={typeColor(t)}
      className="bg-surface border-line flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-xl border px-3.5 py-3"
    >
      <TypeIcon t={t} />
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-[3px]">
        <a className="item-title sm" href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
        <div className="meta">{metaLine(item, t)}</div>
        <Stamps item={item} />
        <Tags tags={item.tags} active={tag} onTag={onTag} />
      </div>
      <div className="flex flex-nowrap items-center gap-2">
        <StatusButton item={item} />
        <ShareButton item={item} />
        <ShelfFavButtons item={item} />
        <ItemMenu item={item} />
      </div>
    </li>
  );
}

import { Dropdown } from "../../../components/ui/Dropdown.tsx";
import { fmtDay, fmtStamp } from "../../../lib/format.ts";
import { typeColor } from "../lib/display.ts";
import { useItemActions } from "../hooks/useItemActions.ts";
import { type Item, STATUS, type TypeDef } from "../types.ts";
import { ShareAvatars, useShares } from "../../shares/index.ts";
import { useItemForm } from "./ItemFormProvider.tsx";

export function TypeIcon({ t }: { t: TypeDef }) {
  return (
    <span className="chip chip-icon" title={t.label} style={typeColor(t)}>
      <i className={`bi ${t.icon}`} />
    </span>
  );
}

export function StatusButton({ item }: { item: Item }) {
  const a = useItemActions();
  const s = STATUS[item.status];
  return (
    <button
      type="button"
      className={`status s-${item.status}`}
      title="Click to change status"
      onClick={() => a.cycleStatus(item)}
    >
      <i className={`bi ${s.icon}`} />
      {s.label}
    </button>
  );
}

export function Stamps({ item }: { item: Item }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
      <span className="stamp">Saved {fmtStamp(item.savedAt)}</span>
      {item.remindAt && (
        <span className="stamp text-ink!">
          <i className="bi bi-bell" />
          Remind {fmtDay(item.remindAt)}
        </span>
      )}
    </div>
  );
}

export function Tags({
  tags,
  active,
  onTag,
}: {
  tags: string[];
  active: string | null;
  onTag: (t: string) => void;
}) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <button
          key={t}
          type="button"
          className={`tag ${active === t ? "on" : ""}`}
          onClick={() => onTag(t)}
        >
          #{t}
        </button>
      ))}
    </div>
  );
}

export function ShelfFavButtons({ item }: { item: Item }) {
  const a = useItemActions();
  const on = a.onShelf(item);
  return (
    <>
      <button
        type="button"
        className={`btn-icon ${on ? "is-shelf" : ""}`}
        aria-pressed={on}
        aria-label={on ? "Take off my shelf" : "Put on my shelf"}
        title={on ? "On your shelf. Friends can see it." : "Put on my shelf"}
        onClick={() => a.toggleShelf(item)}
      >
        <i className="bi bi-bookshelf" />
      </button>
      <button
        type="button"
        className={`btn-icon ${item.fav ? "is-fav" : ""}`}
        aria-pressed={item.fav}
        aria-label={item.fav ? "Remove from favourites" : "Add to favourites"}
        onClick={() => a.toggleFav(item)}
      >
        <i className={`bi ${item.fav ? "bi-star-fill" : "bi-star"}`} />
      </button>
    </>
  );
}

const menuItem =
  "hover:bg-surface-2 text-ink flex w-full items-center gap-[.6rem] px-4 py-1 text-left whitespace-nowrap no-underline";

export function ItemMenu({ item }: { item: Item }) {
  const a = useItemActions();
  const form = useItemForm();
  const shares = useShares();
  return (
    <Dropdown label="More actions" trigger={<i className="bi bi-three-dots" />}>
      {(close) => (
        <div role="menu">
          <a
            role="menuitem"
            className={menuItem}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
          >
            <i className="bi bi-box-arrow-up-right" />
            Open link
          </a>
          <button
            type="button"
            role="menuitem"
            className={menuItem}
            onClick={() => (close(), form.openEdit(item))}
          >
            <i className="bi bi-pencil" />
            Edit name, tags and note
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItem}
            onClick={() => (close(), shares.openShare(item))}
          >
            <i className="bi bi-send" />
            Share
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItem}
            onClick={() => (close(), a.copy(item))}
          >
            <i className="bi bi-clipboard" />
            Copy link
          </button>
          <hr className="border-line my-2" />
          <button
            type="button"
            role="menuitem"
            className={`${menuItem} text-danger!`}
            onClick={() => (close(), form.confirmDelete(item))}
          >
            <i className="bi bi-trash" />
            Delete
          </button>
        </div>
      )}
    </Dropdown>
  );
}

export function ShareButton({ item, bordered }: { item: Item; bordered?: boolean }) {
  const { openShare } = useShares();
  return (
    <>
      <ShareAvatars itemId={item.id} />
      <button
        type="button"
        className={`btn-icon ${bordered ? "bordered" : ""}`}
        aria-label={`Share ${item.title}`}
        onClick={() => openShare(item)}
      >
        <i className="bi bi-send" />
      </button>
    </>
  );
}

import { useId, useState } from "react";
import { Field } from "../../../components/ui/Field.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { ApiError } from "../../../lib/api-client.ts";
import { fmtStamp, fromLocalInput, toLocalInput } from "../../../lib/format.ts";
import { bare, detectType, guessTitle, normUrl } from "../../../lib/url.ts";
import { useAuth } from "../../auth/index.ts";
import { useItemMutations } from "../hooks/useItemMutations.ts";
import { useItems } from "../hooks/useItems.ts";
import { tagCounts } from "../lib/filter.ts";
import { type Item, TYPE_ICONS, typeDefs } from "../types.ts";
import { addTags } from "../lib/tags.ts";
import { TagInput } from "./TagInput.tsx";

const NEW = "__new";
type Errors = Record<string, string | undefined>;

type Props = {
  item?: Item;
  preUrl?: string;
  defaultColl?: string;
  onClose: () => void;
  onSaved?: () => void;
};

export function ItemForm({ item, preUrl = "", defaultColl = "", onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { items } = useItems();
  const m = useItemMutations();
  const toast = useToast();
  const ids = {
    type: useId(),
    coll: useId(),
    mins: useId(),
    note: useId(),
    remind: useId(),
    shelf: useId(),
  };
  const defs = typeDefs(user!.customTypes);
  const onShelf = !!item && user!.shelf.includes(item.id);

  const [f, setF] = useState({
    url: item?.url ?? preUrl,
    title: item?.title ?? (preUrl ? guessTitle(preUrl) : ""),
    type: item?.type ?? (preUrl ? detectType(preUrl) : "article"),
    coll: item?.coll ?? defaultColl,
    mins: item?.mins ? String(item.mins) : "",
    note: item?.note ?? "",
    remind: toLocalInput(item?.remindAt ?? null),
    shelf: onShelf,
    typeName: "",
    typeIcon: TYPE_ICONS[0]!,
    collName: "",
  });
  const [tags, setTags] = useState(item?.tags ?? []);
  const [draft, setDraft] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));

  const norm = normUrl(f.url);
  const dup = !item && norm ? items.find((i) => bare(i.url) === bare(norm)) : undefined;

  async function save() {
    const e: Errors = {};
    if (!norm) e.url = "Enter a full link that starts with https://";
    if (!f.title.trim()) e.title = "Give this link a name.";
    if (f.type === NEW && !f.typeName.trim()) e.typeName = "Give the new type a name.";
    if (f.coll === NEW && !f.collName.trim()) e.collName = "Give the new collection a name.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const type = f.type === NEW ? await m.addType(f.typeName, f.typeIcon) : f.type;
      const coll = f.coll === NEW ? await m.addCollection(f.collName) : f.coll;
      const data = {
        url: norm!,
        title: f.title.trim(),
        type,
        coll,
        mins: Number(f.mins) || 0,
        note: f.note.trim(),
        remindAt: fromLocalInput(f.remind),
        tags: addTags(tags, draft),
      };
      const saved = item ? await m.update(item.id, data) : await m.create(data);
      const shelf = user!.shelf.filter((id) => id !== saved.id);
      if (f.shelf !== onShelf) await m.setShelf(f.shelf ? [...shelf, saved.id] : shelf);
      toast(item ? "Changes saved" : "Saved to your library");
      onSaved?.();
      onClose();
    } catch (err) {
      setErrors(
        err instanceof ApiError
          ? { ...err.fields, form: err.fields ? undefined : err.message }
          : { form: "Could not save. Try again." },
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={item ? "Edit link" : "Save a link"}
      submitLabel={item ? "Save changes" : "Save to library"}
      busy={busy}
      onClose={onClose}
      onSubmit={save}
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Link"
          type="url"
          placeholder="https://"
          value={f.url}
          error={errors.url}
          autoFocus={!f.url}
          hint={
            dup && (
              <span className="text-warn font-semibold">
                You already saved this as "{dup.title}" on {fmtStamp(dup.savedAt)}.
              </span>
            )
          }
          onChange={(e) => {
            const url = e.target.value;
            const u = normUrl(url);
            // Like the prototype: keep detecting the type until the user has named the link.
            set(u && !f.title && f.type !== NEW ? { url, type: detectType(u) } : { url });
          }}
        />
        <Field
          label="Name"
          maxLength={120}
          placeholder="What will you remember this as?"
          value={f.title}
          error={errors.title}
          autoFocus={!!f.url}
          onChange={(e) => set({ title: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-[4fr_5fr_3fr]">
          <div>
            <label className="label" htmlFor={ids.type}>
              Type
            </label>
            <select
              id={ids.type}
              className="field"
              value={f.type}
              onChange={(e) => set({ type: e.target.value })}
            >
              {Object.values(defs).map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
              <option value={NEW}>New type…</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor={ids.coll}>
              Collection
            </label>
            <select
              id={ids.coll}
              className="field"
              value={f.coll}
              onChange={(e) => set({ coll: e.target.value })}
            >
              <option value="">None</option>
              {user!.collections.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option value={NEW}>New collection…</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor={ids.mins}>
              Minutes
            </label>
            <input
              id={ids.mins}
              className="field"
              type="number"
              min={0}
              max={6000}
              placeholder="20"
              value={f.mins}
              onChange={(e) => set({ mins: e.target.value })}
            />
          </div>
        </div>
        {f.type === NEW && (
          <div className="bg-surface-2 rounded-xl px-3.5 py-3">
            <Field
              label="Name your type"
              maxLength={20}
              autoComplete="off"
              placeholder="For example Book, Thread or Newsletter"
              value={f.typeName}
              error={errors.typeName}
              onChange={(e) => set({ typeName: e.target.value })}
            />
            <div className="label mt-3" id={`${ids.type}-icons`}>
              Pick an icon
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-labelledby={`${ids.type}-icons`}
            >
              {TYPE_ICONS.map((ic) => (
                <label key={ic}>
                  <input
                    type="radio"
                    name="typeIcon"
                    className="peer sr-only"
                    aria-label={ic.slice(3).replace(/-/g, " ")}
                    checked={f.typeIcon === ic}
                    onChange={() => set({ typeIcon: ic })}
                  />
                  <span className="border-line text-ink hover:bg-surface-2 peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand peer-focus-visible:outline-brand grid h-9 w-10 cursor-pointer place-items-center rounded-[.5rem] border peer-focus-visible:outline-2">
                    <i className={`bi ${ic}`} />
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        {f.coll === NEW && (
          <div className="bg-surface-2 rounded-xl px-3.5 py-3">
            <Field
              label="Name your collection"
              maxLength={30}
              autoComplete="off"
              placeholder="For example Weekend reads"
              value={f.collName}
              error={errors.collName}
              onChange={(e) => set({ collName: e.target.value })}
            />
          </div>
        )}
        <TagInput
          tags={tags}
          draft={draft}
          suggestions={tagCounts(items).map(([t]) => t)}
          onTags={setTags}
          onDraft={setDraft}
        />
        <div>
          <label className="label" htmlFor={ids.note}>
            Note
          </label>
          <textarea
            id={ids.note}
            className="field"
            rows={2}
            placeholder="Why did you save this?"
            value={f.note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </div>
        <div>
          <label className="flex items-center gap-2" htmlFor={ids.shelf}>
            <input
              id={ids.shelf}
              type="checkbox"
              role="switch"
              className="check"
              checked={f.shelf}
              onChange={(e) => set({ shelf: e.target.checked })}
            />
            Show on my shelf
          </label>
          <div className="text-muted text-[0.875em]">
            Friends can see links on your shelf. Everything else stays private.
          </div>
        </div>
        <div>
          <label className="label" htmlFor={ids.remind}>
            Remind me
          </label>
          <input
            id={ids.remind}
            className="field"
            type="datetime-local"
            value={f.remind}
            onChange={(e) => set({ remind: e.target.value })}
          />
          <div className="text-muted mt-1 text-[0.875em]">Leave empty for no reminder.</div>
        </div>
        {errors.form && (
          <div
            role="alert"
            className="bg-danger/10 text-danger rounded-[10px] px-3 py-2.5 text-[0.9rem]"
          >
            {errors.form}
          </div>
        )}
      </div>
    </Modal>
  );
}

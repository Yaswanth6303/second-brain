import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Field } from "../../../components/ui/Field.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { ApiError } from "../../../lib/api-client.ts";
import { plural } from "../../../lib/format.ts";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { domain } from "../../../lib/url.ts";
import { useAuth } from "../../auth/index.ts";
import { type Person, useFriends } from "../../friends/index.ts";
import { type Item, TypeIcon, typeDefs, typeOf } from "../../library/index.ts";
import { useSentSharesQuery } from "../hooks/useSentShares.ts";
import { applyShareDiff } from "../lib/diff.ts";
import { ShareTargets } from "./ShareTargets.tsx";

export function ShareModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const sent = useSentSharesQuery();
  const current = sent.shares.filter((s) => s.item === item.id);
  const friendIds = new Set(useFriends().friends.map((f) => f.user.id));
  const extraPeople = current
    .filter((s) => s.kind === "friend" && !friendIds.has(s.to.id))
    .map((s) => s.to as Person);
  // Follows the loaded shares until the user changes a tick, so a late load can't untick anything.
  const [edited, setPicked] = useState<{ friends: string[]; groups: string[] } | null>(null);
  const picked = edited ?? {
    friends: current.filter((s) => s.kind === "friend").map((s) => s.to.id),
    groups: current.filter((s) => s.kind === "group").map((s) => s.to.id),
  };
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const t = typeOf(typeDefs(useAuth().user!.customTypes), item.type);

  async function submit() {
    setBusy(true);
    try {
      const n = await applyShareDiff(item.id, current, {
        ...picked,
        handles: [handle.trim()],
        msg: msg.trim(),
      });
      toast(n ? `On ${plural(n, "watchlist")} now` : "No longer shared with anyone");
      await refreshSocial(qc);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update sharing. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Share this link"
      submitLabel="Update sharing"
      busy={busy || !sent.ready}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <TypeIcon t={t} />
          <div className="min-w-0">
            <div className="item-title sm">{item.title}</div>
            <div className="meta">{domain(item.url)}</div>
          </div>
        </div>
        {sent.ready ? (
          <ShareTargets
            legend="Friends and groups"
            {...picked}
            extraPeople={extraPeople}
            onChange={setPicked}
            help="Ticked names have this link on their watchlist. Untick to take it off."
          />
        ) : (
          <p className="meta m-0">Loading watchlists…</p>
        )}
        <Field
          label="Or send to a username"
          placeholder="@username"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <div>
          <label className="label" htmlFor="share-msg">
            Message, if you want one
          </label>
          <textarea
            id="share-msg"
            className="field"
            rows={2}
            placeholder="Why should they open this?"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
        </div>
        {error && (
          <div
            role="alert"
            className="bg-danger/10 text-danger rounded-[10px] px-3 py-2.5 text-[0.9rem]"
          >
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

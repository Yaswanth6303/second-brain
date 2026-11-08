import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { Avatar, GroupAvatar } from "../../../components/ui/Avatar.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { fmtStamp } from "../../../lib/format.ts";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { useGroups } from "../../groups/index.ts";
import { type SentShare, deleteShare, useSentShares } from "../../shares/index.ts";

type Row = {
  key: string;
  to: SentShare["to"];
  kind: SentShare["kind"];
  list: SentShare[];
  finished: number;
  label: string;
};

// Everyone who can see links you shared, and how far they got.
export function SharedWith() {
  const shares = useSentShares();
  const groups = useGroups().groups;
  const qc = useQueryClient();
  const toast = useToast();
  const [stopping, setStopping] = useState<Row | null>(null);

  const rows: Row[] = [];
  for (const s of shares) {
    const key = `${s.kind}:${s.to.id}`;
    let row = rows.find((r) => r.key === key);
    if (!row) {
      const g = groups.find((x) => x.id === s.to.id);
      row = {
        key,
        to: s.to,
        kind: s.kind,
        list: [],
        finished: 0,
        label: s.kind === "friend" ? "Friend" : `Group of ${g?.members.length ?? "?"}`,
      };
      rows.push(row);
    }
    row.list.push(s);
    // A group link counts as finished once everyone else in the group finished it.
    const others = (groups.find((x) => x.id === s.to.id)?.members.length ?? 1) - 1;
    if (s.kind === "friend" ? s.seen === "done" : others > 0 && s.done.length >= others)
      row.finished++;
  }

  if (!rows.length)
    return (
      <EmptyState
        icon="bi-share"
        title="You have not shared anything"
        text="Use the share button on any link to send it to a friend or a group."
      />
    );

  async function stop(r: Row) {
    try {
      await Promise.all(r.list.map((s) => deleteShare(s.id)));
      toast(`Stopped sharing with ${r.to.name}`);
      await refreshSocial(qc);
    } catch {
      toast("Could not stop sharing. Try again.");
    } finally {
      setStopping(null);
    }
  }

  const cell = "border-line border-t px-2 py-2.5 align-middle";
  return (
    <>
      <p className="meta">Everyone who can see links you shared, and how far they got.</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-muted text-[.82rem]">
              {["Shared with", "Type", "Links", "Finished", "Last shared"].map((h) => (
                <th key={h} className="px-2 py-2 font-semibold">
                  {h}
                </th>
              ))}
              <th className="px-2 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td className={cell}>
                  <span className="flex items-center gap-2 font-semibold whitespace-nowrap">
                    {"hue" in r.to ? (
                      <Avatar name={r.to.name} hue={r.to.hue} size={28} />
                    ) : (
                      <GroupAvatar name={r.to.name} size={28} />
                    )}
                    {r.to.name}
                  </span>
                </td>
                <td className={`${cell} whitespace-nowrap`}>{r.label}</td>
                <td className={cell}>
                  <span className="n">{r.list.length}</span>
                </td>
                <td className={cell}>
                  <span className="n">
                    {r.finished} of {r.list.length}
                  </span>
                </td>
                <td className={`${cell} whitespace-nowrap`}>
                  <span className="stamp">
                    {fmtStamp(
                      r.list
                        .map((s) => s.at)
                        .toSorted()
                        .at(-1)!,
                    )}
                  </span>
                </td>
                <td className={cell}>
                  <span className="flex justify-end gap-2">
                    <Link
                      to={r.kind === "friend" ? `/friends/${r.to.id}` : `/groups/${r.to.id}`}
                      className="border-line text-ink hover:bg-surface-2 inline-flex items-center rounded-[.5rem] border px-2 py-1 text-[.875rem] font-semibold whitespace-nowrap no-underline"
                    >
                      Open watchlist
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => setStopping(r)}
                    >
                      Stop sharing
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stopping && (
        <Modal
          title="Stop sharing?"
          submitLabel="Stop sharing"
          danger
          onClose={() => setStopping(null)}
          onSubmit={() => stop(stopping)}
        >
          <p className="m-0">
            {stopping.to.name} loses every link you shared. Your library stays as it is.
          </p>
        </Modal>
      )}
    </>
  );
}

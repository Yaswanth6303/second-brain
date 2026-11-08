import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Avatar, GroupAvatar } from "../../../components/ui/Avatar.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { Dropdown, MenuItem } from "../../../components/ui/Dropdown.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { rel } from "../../../lib/format.ts";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { domain } from "../../../lib/url.ts";
import { useAuth } from "../../auth/index.ts";
import { firstName, useFriends } from "../../friends/index.ts";
import { useInboxActions } from "../../inbox/index.ts";
import { TypeIcon, dur, typeColor, typeDefs, typeOf } from "../../library/index.ts";
import { deleteShare, useShares } from "../../shares/index.ts";
import { deleteGroup, leaveGroup } from "../api/groups.ts";
import { GroupForm } from "../components/GroupForm.tsx";
import { useGroupPage } from "../hooks/useGroups.ts";

const row =
  "bg-surface border-line flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-xl border px-3.5 py-3";

export function GroupPage() {
  const { id = "" } = useParams();
  const { data, isPending, isError } = useGroupPage(id);
  const me = useAuth().user!;
  const friendIds = new Set(useFriends().friends.map((f) => f.user.id));
  const defs = typeDefs(me.customTypes);
  const { openPick } = useShares();
  const inbox = useInboxActions();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"edit" | "delete" | "leave" | null>(null);

  if (isPending) return null;
  if (isError || !data)
    return (
      <EmptyState
        icon="bi-diagram-3"
        title="Group not found"
        text="It may have been deleted, or you are no longer a member."
        action={
          <Link className="linkish" to="/groups">
            All groups
          </Link>
        }
      />
    );

  const { group: g, watchlist } = data;
  const owner = g.owner === me.id;
  const others = g.members.filter((m) => m.id !== me.id);
  const pick = () => openPick({ kind: "group", id: g.id, label: g.name });
  const leaveOrDelete = async (fn: () => Promise<void>, msg: string) => {
    try {
      await fn();
      toast(msg);
      await refreshSocial(qc);
      void navigate("/groups");
    } catch {
      toast("Could not do that. Try again.");
    }
  };

  return (
    <>
      <Link className="back" to="/groups">
        <i className="bi bi-arrow-left" />
        All groups
      </Link>
      <section className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-4">
        <GroupAvatar name={g.name} size={64} />
        <div className="min-w-0 flex-1">
          <h1>{g.name}</h1>
          {g.desc && <p className="meta mb-0">{g.desc}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={pick}>
            <i className="bi bi-plus-lg" /> Add to watchlist
          </Button>
          <Dropdown
            label="More"
            triggerClassName="btn-icon bordered"
            trigger={<i className="bi bi-three-dots" />}
          >
            {(close) => (
              <div role="menu">
                {owner ? (
                  <>
                    <MenuItem icon="bi-people" onClick={() => (close(), setDialog("edit"))}>
                      Edit name and members
                    </MenuItem>
                    <MenuItem icon="bi-trash" danger onClick={() => (close(), setDialog("delete"))}>
                      Delete group
                    </MenuItem>
                  </>
                ) : (
                  <MenuItem
                    icon="bi-box-arrow-right"
                    danger
                    onClick={() => (close(), setDialog("leave"))}
                  >
                    Leave group
                  </MenuItem>
                )}
              </div>
            )}
          </Dropdown>
        </div>
      </section>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="meta">Members</span>
        <span className="status">
          <Avatar name={me.name} hue={me.hue} size={20} /> You
        </span>
        {others.map((m) =>
          friendIds.has(m.id) ? (
            <Link
              key={m.id}
              to={`/friends/${m.id}`}
              className="status hover:bg-surface-2 no-underline"
            >
              <Avatar name={m.name} hue={m.hue} size={20} /> {firstName(m)}
            </Link>
          ) : (
            <span key={m.id} className="status">
              <Avatar name={m.name} hue={m.hue} size={20} /> {firstName(m)}
            </span>
          ),
        )}
      </div>
      <h2 className="mb-3">
        Group watchlist <span className="n">{watchlist.length}</span>
      </h2>
      {watchlist.length ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {watchlist.map((l) => {
            const t = typeOf(defs, l.type);
            // "Finished" counts everyone except the person who added it.
            const total = g.members.length - 1;
            const d = l.done.length;
            const meta = [
              domain(l.url),
              dur(l.mins, t),
              `added by ${l.mine ? "you" : firstName(l.from)} ${rel(l.at)}`,
            ];
            return (
              <li key={l.shareId} style={typeColor(t)} className={row}>
                <TypeIcon t={t} />
                <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-[3px]">
                  <a
                    className="item-title sm"
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {l.title}
                  </a>
                  <div className="meta">{meta.filter(Boolean).join(" · ")}</div>
                  {l.msg && (
                    <div className="react">
                      <i className="bi bi-chat-left-quote text-muted" />
                      {l.msg}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {l.mine ? (
                    <>
                      <span className="av-stack">
                        {l.done.map((x) => (
                          <Avatar key={x.user.id} name={x.user.name} hue={x.user.hue} size={24} />
                        ))}
                      </span>
                      <span
                        className={`status static ${d === total && total ? "s-done" : d ? "s-progress" : ""}`}
                      >
                        {d} of {total} finished
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label="Remove from watchlist"
                        title="Remove from watchlist"
                        onClick={() =>
                          deleteShare(l.shareId).then(
                            () => (toast("Removed from watchlist"), refreshSocial(qc)),
                            () => toast("Could not save. Try again."),
                          )
                        }
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </>
                  ) : l.saved ? (
                    <span className="status static s-done">
                      <i className="bi bi-check-circle-fill" />
                      In your library
                    </span>
                  ) : (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => inbox.save(l.shareId)}
                    >
                      <i className="bi bi-plus-lg" /> Save to library
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon="bi-bookmark-plus"
          title="This watchlist is empty"
          text="Add the first link for the group."
          action={
            <Button size="sm" onClick={pick}>
              Add links
            </Button>
          }
        />
      )}
      {dialog === "edit" && <GroupForm group={g} onClose={() => setDialog(null)} />}
      {dialog === "delete" && (
        <Modal
          title="Delete this group?"
          submitLabel="Delete group"
          danger
          onClose={() => setDialog(null)}
          onSubmit={() => leaveOrDelete(() => deleteGroup(g.id), "Group deleted")}
        >
          <p className="m-0">"{g.name}" and its shared watchlist go away for every member.</p>
        </Modal>
      )}
      {dialog === "leave" && (
        <Modal
          title="Leave this group?"
          submitLabel="Leave group"
          danger
          onClose={() => setDialog(null)}
          onSubmit={() => leaveOrDelete(() => leaveGroup(g.id), `You left ${g.name}`)}
        >
          <p className="m-0">
            You stop seeing its watchlist. Links you saved stay in your library.
          </p>
        </Modal>
      )}
    </>
  );
}

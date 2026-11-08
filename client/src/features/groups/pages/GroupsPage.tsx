import { useState } from "react";
import { Link } from "react-router";
import { PageHead } from "../../../components/layout/PageHead.tsx";
import { Avatar, GroupAvatar } from "../../../components/ui/Avatar.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { plural } from "../../../lib/format.ts";
import { useAuth } from "../../auth/index.ts";
import { useFriends } from "../../friends/index.ts";
import { useShares } from "../../shares/index.ts";
import { GroupForm } from "../components/GroupForm.tsx";
import { useGroups } from "../hooks/useGroups.ts";

export function GroupsPage() {
  const { groups, isPending } = useGroups();
  const hasFriends = useFriends().friends.length > 0;
  const me = useAuth().user!.id;
  const { openPick } = useShares();
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHead
        title="Groups"
        sub="A group shares one watchlist. Everyone can add to it and mark what they finished."
        actions={
          <Button
            onClick={() =>
              hasFriends ? setCreating(true) : toast("Add a friend before you create a group")
            }
          >
            <i className="bi bi-plus-lg" /> New group
          </Button>
        }
      />
      {isPending ? null : groups.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-4">
          {groups.map((g) => {
            const others = g.members.filter((m) => m.id !== me);
            return (
              <article
                key={g.id}
                className="bg-surface border-line flex min-w-0 flex-col gap-2.5 rounded-[14px] border p-4"
              >
                <div className="flex items-center gap-3">
                  <GroupAvatar name={g.name} size={48} />
                  <div className="min-w-0">
                    <div className="item-title">{g.name}</div>
                    <div className="meta">You and {plural(others.length, "member")}</div>
                  </div>
                </div>
                {g.desc && <p className="note">{g.desc}</p>}
                <div className="flex items-center gap-2">
                  <span className="av-stack">
                    {others.map((m) => (
                      <Avatar key={m.id} name={m.name} hue={m.hue} size={28} />
                    ))}
                  </span>
                  <span className="meta ml-auto">{plural(g.links, "link")}</span>
                </div>
                <div className="mt-auto flex gap-2">
                  <Link
                    to={`/groups/${g.id}`}
                    className="border-brand text-brand hover:bg-brand hover:text-brand-ink inline-flex flex-1 items-center justify-center rounded-[.5rem] border px-2 py-1 text-[.875rem] font-semibold no-underline"
                  >
                    Open watchlist
                  </Link>
                  <Button
                    size="sm"
                    aria-label={`Add links to ${g.name}`}
                    onClick={() => openPick({ kind: "group", id: g.id, label: g.name })}
                  >
                    <i className="bi bi-plus-lg" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="bi-diagram-3"
          title="No groups yet"
          text="Create a group to share one watchlist with several friends."
        />
      )}
      {creating && <GroupForm onClose={() => setCreating(false)} />}
    </>
  );
}

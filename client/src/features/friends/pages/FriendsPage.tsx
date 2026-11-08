import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHead } from "../../../components/layout/PageHead.tsx";
import { Avatar } from "../../../components/ui/Avatar.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { useShares } from "../../shares/index.ts";
import { acceptRequest, declineRequest } from "../api/friends.ts";
import { AddFriendModal } from "../components/AddFriendModal.tsx";
import { FriendCard } from "../components/FriendCard.tsx";
import { useFriends } from "../hooks/useFriends.ts";

const row =
  "bg-surface border-line flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-xl border px-3.5 py-3";

export function FriendsPage() {
  const { friends, requests, sent, isPending } = useFriends();
  const { openPick } = useShares();
  const [adding, setAdding] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const failed = () => toast("Could not save. Try again.");

  return (
    <>
      <PageHead
        title="Friends"
        sub="Each friend has a watchlist: the links you picked for them."
        actions={
          <Button onClick={() => setAdding(true)}>
            <i className="bi bi-person-plus" /> Add friend
          </Button>
        }
      />
      {requests.length > 0 && (
        <ul className="mb-6 flex list-none flex-col gap-2.5 p-0">
          {requests.map((r) => (
            <li key={r.id} className={row}>
              <Avatar name={r.user.name} hue={r.user.hue} size={40} />
              <div className="flex min-w-0 flex-[1_1_240px] flex-col">
                <b>{r.user.name}</b>
                <span className="meta">@{r.user.handle} wants to share links with you</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    acceptRequest(r.id).then(
                      () => (toast(`${r.user.name} is now a friend`), refreshSocial(qc)),
                      failed,
                    )
                  }
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    declineRequest(r.id).then(
                      () => (toast("Request declined"), refreshSocial(qc)),
                      failed,
                    )
                  }
                >
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {isPending ? null : friends.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-4">
          {friends.map((f) => (
            <FriendCard
              key={f.user.id}
              f={f}
              onPick={() =>
                openPick({
                  kind: "friend",
                  id: f.user.id,
                  label: `${f.user.name.split(" ")[0]}'s watchlist`,
                })
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="bi-people"
          title="No friends yet"
          text="Add a friend by username or email to start a watchlist for them."
        />
      )}
      {sent.length > 0 && (
        <>
          <h2 className="mt-6 mb-2">Requests you sent</h2>
          <ul className="flex list-none flex-col gap-2.5 p-0">
            {sent.map((s) => (
              <li key={s.id} className={row}>
                <i className="bi bi-hourglass-split" />
                <div className="min-w-0 flex-1">
                  {s.user.name} <span className="meta">@{s.user.handle}</span>
                </div>
                <span className="status static">Waiting for a reply</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {adding && <AddFriendModal onClose={() => setAdding(false)} />}
    </>
  );
}

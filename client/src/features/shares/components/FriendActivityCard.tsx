import { SideCard } from "../../../components/layout/RightRail.tsx";
import { Avatar } from "../../../components/ui/Avatar.tsx";
import { type Person, firstName } from "../../friends/index.ts";
import { useSentShares } from "../hooks/useSentShares.ts";

type Event = { who: Person; did: "opened" | "finished"; title: string; at: string; group?: string };

export function FriendActivityCard() {
  const events: Event[] = useSentShares()
    .flatMap((s): Event[] =>
      s.kind === "friend"
        ? s.seen !== "new" && s.seenAt
          ? [
              {
                who: s.to as Person,
                did: s.seen === "done" ? "finished" : "opened",
                title: s.title,
                at: s.seenAt,
              },
            ]
          : []
        : s.done.map((d) => ({
            who: d.user,
            did: "finished" as const,
            title: s.title,
            at: d.at,
            group: s.to.name,
          })),
    )
    .toSorted((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);
  return (
    <SideCard title="Friend activity">
      {events.length ? (
        <ul className="side-list">
          {events.map((e, k) => (
            <li key={k}>
              <Avatar name={e.who.name} hue={e.who.hue} size={24} />
              <div className="min-w-0">
                <b>{firstName(e.who)}</b> {e.did} {e.title}
                {e.group && <span className="meta"> in {e.group}</span>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">Share a link and you will see here when friends open it.</p>
      )}
    </SideCard>
  );
}

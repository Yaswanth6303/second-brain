import { Link } from "react-router";
import { Avatar } from "../../../components/ui/Avatar.tsx";
import { Progress } from "../../../components/ui/Progress.tsx";
import { plural } from "../../../lib/format.ts";
import type { FriendSummary } from "../api/friends.ts";
import { firstName } from "../types.ts";

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-[.5rem] border px-2 py-1 text-[.875rem] font-semibold no-underline";

export function FriendCard({ f, onPick }: { f: FriendSummary; onPick?: () => void }) {
  const pct = f.sent ? Math.round((f.done / f.sent) * 100) : 0;
  const first = firstName(f.user);
  return (
    <article className="bg-surface border-line flex min-w-0 flex-col gap-2.5 rounded-[14px] border p-4">
      <div className="flex items-center gap-3">
        <Avatar name={f.user.name} hue={f.user.hue} size={48} />
        <div className="min-w-0">
          <div className="item-title">{f.user.name}</div>
          <div className="meta">@{f.user.handle}</div>
        </div>
      </div>
      <div>
        <div className="mb-2">
          <Progress value={pct} label="Watchlist progress" />
        </div>
        <div className="meta">
          {f.sent
            ? `Finished ${f.done} of ${plural(f.sent, "link")} on their watchlist`
            : "Nothing on their watchlist yet"}
        </div>
      </div>
      <div className="meta">
        <i className="bi bi-inbox mr-1" />
        Sent you {plural(f.received, "link")}
      </div>
      <div className="mt-auto flex gap-2">
        <Link
          to={`/friends/${f.user.id}`}
          aria-label={`Open watchlist for ${f.user.name}`}
          className={`${btn} border-brand text-brand hover:bg-brand hover:text-brand-ink flex-1`}
        >
          Open watchlist
        </Link>
        <Link
          to={`/friends/${f.user.id}?tab=shelf`}
          aria-label={`See ${first}'s shelf`}
          title="See shelf"
          className={`${btn} border-line text-ink hover:bg-surface-2`}
        >
          <i className="bi bi-bookshelf" />
        </Link>
        {onPick && (
          <button
            type="button"
            aria-label={`Add links to ${first}'s watchlist`}
            onClick={onPick}
            className={`${btn} bg-brand border-brand text-brand-ink hover:bg-brand-strong`}
          >
            <i className="bi bi-plus-lg" />
          </button>
        )}
      </div>
    </article>
  );
}

import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../features/auth/index.ts";
import { useFriends } from "../../features/friends/index.ts";
import { useGroups } from "../../features/groups/index.ts";
import { useInbox } from "../../features/inbox/index.ts";
import { tagCounts, useItems } from "../../features/library/index.ts";

const LINKS = [
  { to: "/library", icon: "bi-collection", label: "Library" },
  { to: "/inbox", icon: "bi-inbox", label: "Shared with me" },
  { to: "/friends", icon: "bi-people", label: "Friends" },
  { to: "/groups", icon: "bi-diagram-3", label: "Groups" },
  { to: "/profile", icon: "bi-person-circle", label: "Profile" },
];

const linkCls = (on: boolean) =>
  `flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[.92rem] font-medium no-underline ${
    on ? "bg-brand-soft text-brand font-semibold" : "text-ink hover:bg-surface-2"
  }`;

const label = "text-muted px-2.5 pb-1.5 text-[.7rem] font-semibold tracking-[.09em] uppercase";

// Left navigation: main pages, then collections and top tags that filter the library.
export function Rail({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { items } = useItems();
  const { pathname } = useLocation();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const onLibrary = pathname === "/library";
  const coll = onLibrary ? sp.get("coll") : null;
  const tag = onLibrary ? sp.get("tag") : null;
  const fresh = useInbox().entries.filter((e) => e.state === "new").length;
  const friends = useFriends().friends.length;
  const groups = useGroups().groups.length;
  const counts: Record<string, number> = {
    "/library": items.length,
    "/inbox": fresh,
    "/friends": friends,
    "/groups": groups,
  };

  return (
    <div className="flex min-h-full flex-col gap-5 px-3 py-4 lg:py-5">
      <div className="flex items-center justify-between">
        <div className="font-display flex items-center gap-2.5 px-2 text-[1.15rem] font-bold">
          <span className="bg-mark text-mark-ink grid size-8 flex-none place-items-center rounded-[9px] text-base">
            <i className="bi bi-bookmarks-fill" />
          </span>
          Second Brain
        </div>
        <button
          type="button"
          className="btn-icon lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>
      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => linkCls(isActive && !(l.to === "/library" && coll))}
            onClick={onClose}
          >
            {({ isActive }) => (
              <>
                <i
                  className={`bi ${l.icon} text-[1.05rem] ${isActive ? "text-brand" : "text-muted"}`}
                />
                <span className="min-w-0 flex-1">{l.label}</span>
                {counts[l.to] ? (
                  // New shared links get the prototype's yellow "hot" badge.
                  <span
                    className={
                      l.to === "/inbox"
                        ? "bg-mark text-mark-ink rounded-full px-[7px] py-px font-mono text-[.72rem] font-medium"
                        : "n"
                    }
                  >
                    {counts[l.to]}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {user!.collections.length > 0 && (
        <nav className="flex flex-col gap-0.5" aria-label="Collections">
          <div className={label}>Collections</div>
          {user!.collections.map((c) => (
            <NavLink
              key={c}
              to={coll === c ? "/library" : `/library?coll=${encodeURIComponent(c)}`}
              className={() => linkCls(coll === c)}
              aria-current={coll === c ? "page" : undefined}
              onClick={onClose}
            >
              <i
                className={`bi bi-folder2 text-[1.05rem] ${coll === c ? "text-brand" : "text-muted"}`}
              />
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{c}</span>
              <span className="n">{items.filter((i) => i.coll === c).length}</span>
            </NavLink>
          ))}
        </nav>
      )}
      {items.some((i) => i.tags.length) && (
        <div className="flex flex-col gap-0.5">
          <div className={label}>Top tags</div>
          <div className="flex flex-wrap gap-1.5 px-2">
            {tagCounts(items)
              .slice(0, 10)
              .map(([t]) => (
                <button
                  key={t}
                  type="button"
                  className={`tag ${tag === t ? "on" : ""}`}
                  onClick={() => (
                    onClose(),
                    void navigate(tag === t ? "/library" : `/library?tag=${encodeURIComponent(t)}`)
                  )}
                >
                  #{t}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

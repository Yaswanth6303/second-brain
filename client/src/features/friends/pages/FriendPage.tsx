import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Avatar } from "../../../components/ui/Avatar.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { Tabs } from "../../../components/ui/Tabs.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { plural, rel } from "../../../lib/format.ts";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { bare, domain } from "../../../lib/url.ts";
import { useAuth } from "../../auth/index.ts";
import { InboxRow } from "../../inbox/index.ts";
import {
  Shelf,
  TypeIcon,
  dur,
  typeColor,
  typeDefs,
  typeOf,
  useItemMutations,
  useItems,
} from "../../library/index.ts";
import { deleteShare, useShares } from "../../shares/index.ts";
import { removeFriend } from "../api/friends.ts";
import { useFriendPage } from "../hooks/useFriends.ts";
import { firstName } from "../types.ts";

type Tab = "out" | "in" | "shelf";
const SEEN = {
  new: ["Not opened", "bi-circle", ""],
  opened: ["Opened", "bi-circle-half", "s-progress"],
  done: ["Finished", "bi-check-circle-fill", "s-done"],
} as const;
const SORTS = {
  own: null,
  new: (a: { savedAt: string }, b: { savedAt: string }) => b.savedAt.localeCompare(a.savedAt),
  old: (a: { savedAt: string }, b: { savedAt: string }) => a.savedAt.localeCompare(b.savedAt),
  short: (a: { mins: number }, b: { mins: number }) => (a.mins || 1e9) - (b.mins || 1e9),
  az: (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title),
};
const row =
  "bg-surface border-line flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-xl border px-3.5 py-3";
const list = "m-0 flex list-none flex-col gap-2.5 p-0";

export function FriendPage() {
  const { id = "" } = useParams();
  const [sp, setSp] = useSearchParams();
  const tab = (["out", "in", "shelf"].includes(sp.get("tab") ?? "") ? sp.get("tab") : "out") as Tab;
  const { data, isPending, isError } = useFriendPage(id);
  const me = useAuth().user!;
  const defs = typeDefs(me.customTypes);
  const { items } = useItems();
  const m = useItemMutations();
  const { openPick } = useShares();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [fs, setFs] = useState({ type: "all", sort: "own" as keyof typeof SORTS, fav: false });
  const [removing, setRemoving] = useState(false);

  if (isPending) return null;
  if (isError || !data)
    return (
      <EmptyState
        icon="bi-people"
        title="Not a friend"
        text="You can only see friends' watchlists and shelves."
        action={
          <Link className="linkish" to="/friends">
            All friends
          </Link>
        }
      />
    );

  const { user: fr, watchlist, received, shelf } = data;
  const first = firstName(fr);
  const done = watchlist.filter((w) => w.seen === "done").length;
  const pick = () => openPick({ kind: "friend", id: fr.id, label: `${first}'s watchlist` });
  const setTab = (t: Tab) => setSp(t === "out" ? {} : { tab: t }, { replace: true });

  const shelfTypes = [...new Set(shelf.map((i) => i.type))];
  const sorter = SORTS[fs.sort];
  const shown = shelf.filter(
    (i) => (fs.type === "all" || i.type === fs.type) && (!fs.fav || i.fav),
  );
  const sorted = sorter ? shown.toSorted(sorter) : shown;
  const inLibrary = (url: string) => items.some((i) => bare(i.url) === bare(url));

  async function saveFromShelf(i: (typeof shelf)[number]) {
    try {
      await m.create({
        url: i.url,
        title: i.title,
        type: defs[i.type] && !defs[i.type]!.custom ? i.type : "article",
        mins: i.mins,
        tags: [`from-${first.toLowerCase()}`],
        note: `From ${first}'s shelf.`,
        coll: "",
        remindAt: null,
      });
      toast("Saved to your library");
    } catch {
      toast("Could not save. Try again.");
    }
  }

  return (
    <>
      <Link className="back" to="/friends">
        <i className="bi bi-arrow-left" />
        All friends
      </Link>
      <section className="reader-card" style={{ "--h": fr.hue } as React.CSSProperties}>
        <div className="flex min-w-0 flex-wrap items-start gap-x-5 gap-y-4">
          <span className="rounded-full shadow-[0_0_0_3px_var(--color-card-line)]">
            <Avatar name={fr.name} hue={fr.hue} size={76} />
          </span>
          <div className="min-w-0 flex-[1_1_220px]">
            <h1 className="text-card-ink text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.1]">
              {fr.name}
            </h1>
            <div className="text-card-dim mt-1 text-[.86rem]">@{fr.handle}</div>
            <p className="text-card-dim mt-2 mb-0 max-w-[52ch] text-[.88rem]">
              {watchlist.length
                ? `Finished ${done} of ${plural(watchlist.length, "link")} you picked.`
                : "You have not picked anything for them yet."}{" "}
              {shelf.length ? `${plural(shelf.length, "link")} on their shelf.` : ""}
            </p>
          </div>
        </div>
        <dl className="rc-slip">
          {[
            [
              "Friends since",
              new Date(data.since).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
            ],
            ["On their shelf", shelf.length],
            ["You sent", watchlist.length],
            ["They sent", received.length],
          ].map(([l, v]) => (
            <div key={l}>
              <dt>{l}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="border-card-line col-span-full flex flex-wrap gap-2 border-t pt-4">
          <button type="button" className="btn-mark" onClick={pick}>
            <i className="bi bi-plus-lg" /> Add to watchlist
          </button>
          <button type="button" className="btn-card" onClick={() => setTab("shelf")}>
            <i className="bi bi-bookshelf" /> See {first}'s shelf
          </button>
          <button type="button" className="btn-card" onClick={() => setRemoving(true)}>
            <i className="bi bi-person-dash" /> Remove friend
          </button>
        </div>
      </section>

      <Tabs
        current={tab}
        onChange={setTab}
        tabs={[
          { key: "out", label: `Watchlist for ${first}`, count: watchlist.length },
          { key: "in", label: `From ${first}`, count: received.length },
          { key: "shelf", label: `${first}'s shelf`, count: shelf.length },
        ]}
      />

      {tab === "out" &&
        (watchlist.length ? (
          <>
            <p className="meta">
              {first} finished {done} of {plural(watchlist.length, "link")} you picked.
            </p>
            <ul className={list}>
              {watchlist.map((w) => {
                const t = typeOf(defs, w.item.type);
                const [label, icon, cls] = SEEN[w.seen];
                return (
                  <li key={w.id} style={typeColor(t)} className={row}>
                    <TypeIcon t={t} />
                    <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-[3px]">
                      <a
                        className="item-title sm"
                        href={w.item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {w.item.title}
                      </a>
                      <div className="meta">
                        {[domain(w.item.url), dur(w.item.mins, t), `added ${rel(w.at)}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      {w.react && (
                        <div className="react">
                          <i className="bi bi-chat-left-quote text-muted" />
                          {w.react}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status static ${cls}`}>
                        <i className={`bi ${icon}`} />
                        {label}
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label="Remove from watchlist"
                        title="Remove from watchlist"
                        onClick={() =>
                          deleteShare(w.id).then(
                            () => (toast("Removed from watchlist"), refreshSocial(qc)),
                            () => toast("Could not save. Try again."),
                          )
                        }
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <EmptyState
            icon="bi-bookmark-plus"
            title={`Start ${first}'s watchlist`}
            text="Pick links from your library that they should see."
            action={
              <Button size="sm" onClick={pick}>
                Add links
              </Button>
            }
          />
        ))}

      {tab === "in" &&
        (received.length ? (
          <ul className={list}>
            {received.map((e) => (
              <InboxRow key={e.id} e={e} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="bi-inbox"
            title="Nothing yet"
            text={`${first} has not sent you a link.`}
          />
        ))}

      {tab === "shelf" &&
        (!shelf.length ? (
          <EmptyState
            icon="bi-bookshelf"
            title="Nothing on this shelf"
            text={`${first} has not put any links on show yet.`}
          />
        ) : (
          <>
            <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
              <div
                className="flex max-w-full min-w-0 gap-1.5 overflow-x-auto pb-0.5"
                role="group"
                aria-label="Filter the shelf by type"
              >
                {["all", ...shelfTypes].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`pill ${fs.type === t ? "on" : ""}`}
                    aria-pressed={fs.type === t}
                    onClick={() => setFs({ ...fs, type: t })}
                  >
                    {t === "all" ? "All" : typeOf(defs, t).plural}
                    <span className="n">
                      {t === "all" ? shelf.length : shelf.filter((i) => i.type === t).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="field h-[34px] w-auto! rounded-full py-0 pl-3.5 text-[.86rem] font-semibold"
                  aria-label="Sort the shelf"
                  value={fs.sort}
                  onChange={(e) => setFs({ ...fs, sort: e.target.value as keyof typeof SORTS })}
                >
                  <option value="own">{first}'s order</option>
                  <option value="new">Newest first</option>
                  <option value="old">Oldest first</option>
                  <option value="short">Shortest first</option>
                  <option value="az">Name A to Z</option>
                </select>
                <button
                  type="button"
                  className={`pill ${fs.fav ? "on" : ""}`}
                  aria-pressed={fs.fav}
                  aria-label={`Show ${first}'s favourites only`}
                  onClick={() => setFs({ ...fs, fav: !fs.fav })}
                >
                  <i className={`bi ${fs.fav ? "bi-star-fill" : "bi-star"}`} />
                  <span className="hidden sm:inline">Favourites</span>
                </button>
                <button
                  type="button"
                  className="pill"
                  disabled={fs.type === "all" && fs.sort === "own" && !fs.fav}
                  aria-label="Reset filters and sorting"
                  onClick={() => setFs({ type: "all", sort: "own", fav: false })}
                >
                  <i className="bi bi-arrow-counterclockwise" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>
            {sorted.length ? (
              <>
                <section className="bg-surface border-line mb-3 flex flex-col gap-2.5 rounded-[14px] border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2>{first}'s shelf</h2>
                    <span className="meta">
                      {sorted.length < shelf.length
                        ? `Showing ${sorted.length} of ${shelf.length}. `
                        : ""}
                      Only the links {first} chose to show.
                    </span>
                  </div>
                  <Shelf items={sorted} defs={defs} />
                </section>
                <ul className={list}>
                  {sorted.map((i) => {
                    const t = typeOf(defs, i.type);
                    const meta = [
                      domain(i.url),
                      dur(i.mins, t),
                      i.fav ? "favourite" : i.status === "done" ? "finished" : "",
                      `added ${rel(i.savedAt)}`,
                    ];
                    return (
                      <li key={i.id} style={typeColor(t)} className={row}>
                        <TypeIcon t={t} />
                        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-[3px]">
                          <a
                            className="item-title sm"
                            href={i.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {i.title}
                          </a>
                          <div className="meta">{meta.filter(Boolean).join(" · ")}</div>
                        </div>
                        {inLibrary(i.url) ? (
                          <span className="status static s-done">
                            <i className="bi bi-check-circle-fill" />
                            In your library
                          </span>
                        ) : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => void saveFromShelf(i)}
                          >
                            <i className="bi bi-plus-lg" /> Save to library
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <EmptyState
                icon="bi-search"
                title="Nothing matches"
                text="No link on this shelf fits these filters."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFs({ type: "all", sort: "own", fav: false })}
                  >
                    Clear filters
                  </Button>
                }
              />
            )}
          </>
        ))}

      {removing && (
        <Modal
          title="Remove this friend?"
          submitLabel="Remove friend"
          danger
          onClose={() => setRemoving(false)}
          onSubmit={async () => {
            try {
              await removeFriend(fr.id);
              toast(`${fr.name} removed`);
              await refreshSocial(qc);
              void navigate("/friends");
            } catch {
              toast("Could not remove them. Try again.");
            }
          }}
        >
          <p className="m-0">
            {fr.name} loses the watchlist you made for them, and you lose theirs. Links either of
            you saved stay.
          </p>
        </Modal>
      )}
    </>
  );
}

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SideCard } from "../../../components/layout/RightRail.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { Tabs } from "../../../components/ui/Tabs.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { plural } from "../../../lib/format.ts";
import { useAuth } from "../../auth/index.ts";
import { firstName, useFriends } from "../../friends/index.ts";
import { Shelf, ShelfEditor, tagCounts, typeDefs, useItems } from "../../library/index.ts";
import { useSentShares } from "../../shares/index.ts";
import { GiveAndTake, SaveCalendar, TagCloud, TimeByType } from "../components/Charts.tsx";
import { ReaderCard } from "../components/ReaderCard.tsx";
import { Settings } from "../components/Settings.tsx";
import { SharedWith } from "../components/SharedWith.tsx";
import { ShelfProfile } from "../components/ShelfProfile.tsx";
import { listJoin, monthYear } from "../lib/words.ts";

type Tab = "overview" | "shared" | "settings";

export function ProfilePage() {
  const { tab: raw } = useParams();
  const tab: Tab = raw === "shared" || raw === "settings" ? raw : "overview";
  const navigate = useNavigate();
  const me = useAuth().user!;
  const { items } = useItems();
  const friends = useFriends().friends;
  const sent = useSentShares();
  const toast = useToast();
  const [asFriend, setAsFriend] = useState(false);
  const [editing, setEditing] = useState(false);
  const defs = typeDefs(me.customTypes);
  const byId = new Map(items.map((i) => [i.id, i]));
  const shelf = me.shelf.map((id) => byId.get(id)).filter((i) => !!i);
  const done = items.filter((i) => i.status === "done").length;

  const tags = tagCounts(items)
    .slice(0, 3)
    .map(([t]) => `#${t}`);
  const counts = new Map<string, number>();
  for (const s of sent)
    if (s.kind === "friend") counts.set(s.to.name, (counts.get(s.to.name) ?? 0) + 1);
  const top = [...counts].toSorted((a, b) => b[1] - a[1])[0];
  const taste = [
    tags.length ? `Saves mostly ${listJoin(tags)}.` : "",
    items.length ? `Finished ${done} of ${items.length}.` : "",
    top ? `Shares most with ${firstName({ name: top[0] })}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const shelfTags = tagCounts(shelf)
    .slice(0, 3)
    .map(([t]) => `#${t}`);

  const editor = editing && <ShelfEditor onClose={() => setEditing(false)} />;

  if (asFriend)
    return (
      <>
        <div className="bg-mark text-mark-ink mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-xl px-3.5 py-2.5 font-medium">
          <span>
            <i className="bi bi-eye" /> This is what friends see when they open your name in their
            Friends list: only the links you put on your shelf.
          </span>
          <span className="flex flex-wrap gap-2">
            <button
              type="button"
              className="border-mark-ink rounded-[.5rem] border px-2 py-1 text-[.875rem]"
              onClick={() => setEditing(true)}
            >
              <i className="bi bi-sliders" /> Change the shelf
            </button>
            <button
              type="button"
              className="border-mark-ink rounded-[.5rem] border px-2 py-1 text-[.875rem]"
              onClick={() => setAsFriend(false)}
            >
              Back to my view
            </button>
          </span>
        </div>
        <ReaderCard
          person={me}
          taste={shelfTags.length ? `Shelf is mostly ${listJoin(shelfTags)}.` : ""}
          slip={[
            ["Member since", monthYear(me.createdAt)],
            ["On the shelf", shelf.length],
          ]}
        />
        <ShelfProfile name={me.name} shelf={shelf} />
        {editor}
      </>
    );

  return (
    <>
      <ReaderCard
        person={me}
        email={me.email}
        taste={taste}
        slip={[
          ["Member since", monthYear(me.createdAt)],
          ["Saved", items.length],
          ["Finished", done],
          ["On your shelf", shelf.length],
        ]}
        actions={
          <>
            <button
              type="button"
              className="btn-mark"
              onClick={() => void navigate("/profile/settings")}
            >
              <i className="bi bi-pencil" /> Edit profile
            </button>
            <button type="button" className="btn-card" onClick={() => setEditing(true)}>
              <i className="bi bi-bookshelf" /> Choose my shelf
            </button>
            <button type="button" className="btn-card" onClick={() => setAsFriend(true)}>
              <i className="bi bi-eye" /> See it as a friend
            </button>
            <button
              type="button"
              className="btn-card"
              onClick={() =>
                navigator.clipboard.writeText(`${location.origin}/u/${me.handle}`).then(
                  () => toast("Copied"),
                  () => toast("Copy is blocked here. Select the text and copy it yourself."),
                )
              }
            >
              <i className="bi bi-link-45deg" /> Copy profile link
            </button>
          </>
        }
      />
      <Tabs
        current={tab}
        onChange={(t) => void navigate(t === "overview" ? "/profile" : `/profile/${t}`)}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "shared", label: "Shared with" },
          { key: "settings", label: "Settings" },
        ]}
      />
      {tab === "overview" && (
        <>
          <div className="mb-4">
            <SideCard title="Your shelf">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="meta">
                  {shelf.length} of {plural(items.length, "link")}. Friends see only these, in this
                  order. Everything else stays private.
                </span>
                <Button size="sm" onClick={() => setEditing(true)}>
                  <i className="bi bi-sliders" /> Choose what is on it
                </Button>
              </div>
              {shelf.length ? (
                <Shelf items={shelf} defs={defs} />
              ) : (
                <p className="note">
                  Your shelf is empty, so friends see no links. Add the ones you want to show.
                </p>
              )}
            </SideCard>
          </div>
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <TimeByType items={items} defs={defs} />
            </div>
            <div className="lg:col-span-6">
              <SaveCalendar items={items} />
            </div>
            <div className="lg:col-span-7">
              <GiveAndTake friends={friends} />
            </div>
            <div className="lg:col-span-5">
              <TagCloud items={items} />
            </div>
          </div>
        </>
      )}
      {tab === "shared" && <SharedWith />}
      {tab === "settings" && <Settings onChooseShelf={() => setEditing(true)} />}
      {editor}
    </>
  );
}

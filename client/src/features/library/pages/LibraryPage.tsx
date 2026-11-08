import { useState } from "react";
import { PageHead } from "../../../components/layout/PageHead.tsx";
import { RightRail } from "../../../components/layout/RightRail.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { useAuth } from "../../auth/index.ts";
import { CaptureBar } from "../components/CaptureBar.tsx";
import { ItemCard, ItemRow } from "../components/ItemViews.tsx";
import { FriendActivityCard, PickCard, RemindersCard } from "../components/SideCards.tsx";
import { StatsStrip } from "../components/StatsStrip.tsx";
import { ActiveFilters, type Layout, Toolbar } from "../components/Toolbar.tsx";
import { useFilters } from "../hooks/useFilters.ts";
import { useItems } from "../hooks/useItems.ts";
import { filterItems } from "../lib/filter.ts";
import { typeDefs, typeOf } from "../types.ts";

const LAYOUT_KEY = "sb-layout";

function savedLayout(): Layout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function LibraryPage() {
  const { user } = useAuth();
  const { items, isPending } = useItems();
  const [f, set, reset] = useFilters();
  const [layout, setLayout] = useState(savedLayout);
  const toast = useToast();
  const defs = typeDefs(user!.customTypes);
  const list = filterItems(items, f, user!.shelf);
  const onTag = (t: string) => set({ tag: f.tag === t ? null : t });
  const clear = () =>
    set({ type: "all", status: "all", tag: null, coll: null, q: "", fav: false, shelf: false });

  function changeLayout(l: Layout) {
    setLayout(l);
    try {
      localStorage.setItem(LAYOUT_KEY, l);
    } catch {
      // Not remembered; the choice still applies now.
    }
  }

  return (
    <>
      <PageHead
        title="Library"
        sub="Everything you saved, newest first unless you change the order."
      />
      <CaptureBar items={items} coll={f.coll} />
      <StatsStrip items={items} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Toolbar
            items={items}
            defs={defs}
            f={f}
            set={set}
            layout={layout}
            onLayout={changeLayout}
            onReset={() => (reset(), toast("Filters and sorting reset"))}
          />
          <ActiveFilters f={f} set={set} count={list.length} onClear={clear} />
          <section aria-label="Links">
            {isPending ? null : !items.length ? (
              <EmptyState
                icon="bi-bookmark-plus"
                title="Your library is empty"
                text="Paste a link above to save your first one."
              />
            ) : !list.length ? (
              <EmptyState
                icon="bi-search"
                title="Nothing matches"
                text="No saved link fits these filters."
                action={
                  <Button variant="outline" size="sm" onClick={clear}>
                    Clear filters
                  </Button>
                }
              />
            ) : layout === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-4">
                {list.map((i) => (
                  <ItemCard
                    key={i.id}
                    item={i}
                    t={typeOf(defs, i.type)}
                    tag={f.tag}
                    onTag={onTag}
                  />
                ))}
              </div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {list.map((i) => (
                  <ItemRow key={i.id} item={i} t={typeOf(defs, i.type)} tag={f.tag} onTag={onTag} />
                ))}
              </ul>
            )}
          </section>
        </div>
        <RightRail>
          <PickCard items={items} defs={defs} />
          <RemindersCard items={items} />
          <FriendActivityCard />
        </RightRail>
      </div>
    </>
  );
}

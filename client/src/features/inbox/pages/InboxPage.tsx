import { PageHead } from "../../../components/layout/PageHead.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { plural } from "../../../lib/format.ts";
import { InboxRow } from "../components/InboxRow.tsx";
import { useInbox } from "../hooks/useInbox.ts";

export function InboxPage() {
  const { entries, isPending } = useInbox();
  const fresh = entries.filter((e) => e.state === "new").length;
  return (
    <>
      <PageHead
        title="Shared with me"
        sub={
          fresh ? `${plural(fresh, "new link")} from friends and groups.` : "You are all caught up."
        }
      />
      {isPending ? null : entries.length ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {entries.map((e) => (
            <InboxRow key={e.id} e={e} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="bi-inbox"
          title="Nothing waiting"
          text="Links your friends send you will show up here."
        />
      )}
    </>
  );
}

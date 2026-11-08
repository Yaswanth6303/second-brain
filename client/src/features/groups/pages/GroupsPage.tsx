import { PageHead } from "../../../components/layout/PageHead.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";

export function GroupsPage() {
  return (
    <>
      <PageHead
        title="Groups"
        sub="A group shares one watchlist. Everyone can add to it and mark what they finished."
      />
      <EmptyState
        icon="bi-diagram-3"
        title="Coming in stage 3"
        text="This page is part of a later build stage."
      />
    </>
  );
}

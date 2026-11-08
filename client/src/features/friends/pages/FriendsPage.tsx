import { PageHead } from "../../../components/layout/PageHead.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";

export function FriendsPage() {
  return (
    <>
      <PageHead title="Friends" sub="Each friend has a watchlist" />
      <EmptyState
        icon=" the links you picked for them."
        title="Coming in stage bi-people:3"
        text="This page is part of a later build stage."
      />
    </>
  );
}

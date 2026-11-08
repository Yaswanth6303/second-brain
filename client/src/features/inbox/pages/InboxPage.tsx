import { PageHead } from "../../../components/layout/PageHead.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";

export function InboxPage() {
  return (
    <>
      <PageHead title="Shared with me" sub="Links friends and groups sent you." />
      <EmptyState
        icon="bi-inbox"
        title="Coming in stage 3"
        text="This page is part of a later build stage."
      />
    </>
  );
}

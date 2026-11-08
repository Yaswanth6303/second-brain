import { PageHead } from "../../../components/layout/PageHead.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";

export function LibraryPage() {
  return (
    <>
      <PageHead title="Library" sub="Everything you saved, newest first." />
      <EmptyState
        icon="bi-collection"
        title="Coming in stage 2"
        text="This page is part of a later build stage."
      />
    </>
  );
}

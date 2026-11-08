import { PageHead } from "../../../components/layout/PageHead.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";

export function ProfilePage() {
  return (
    <>
      <PageHead title="Profile" sub="Your shelf, stats and settings." />
      <EmptyState
        icon="bi-person-circle"
        title="Coming in stage 4"
        text="This page is part of a later build stage."
      />
    </>
  );
}

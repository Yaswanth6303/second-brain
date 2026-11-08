import type { ReactNode } from "react";

// The narrow right column of side cards (Pick for me, Reminders, Friend activity), filled in stage 2.
export function RightRail({ children }: { children: ReactNode }) {
  return <aside className="flex flex-col gap-4">{children}</aside>;
}

export function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-surface border-line flex flex-col gap-2.5 rounded-[14px] border p-4">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { ItemFormProvider } from "../../features/library/index.ts";
import { Rail } from "./Rail.tsx";
import { Topbar } from "./Topbar.tsx";

// Fixed left rail at ≥ lg; below that the rail is an off-canvas drawer.
export function AppShell() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <ItemFormProvider>
      <div className="flex min-h-screen">
        {open && (
          <div
            className="fixed inset-0 z-[1040] bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <aside
          aria-label="Navigation"
          className={`bg-surface fixed inset-y-0 left-0 z-[1045] w-[280px] overflow-y-auto transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:flex-none lg:translate-x-0 lg:border-r lg:border-line ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Rail onClose={() => setOpen(false)} />
        </aside>
        <div className="min-w-0 flex-1">
          <Topbar onMenu={() => setOpen(true)} />
          <main className="max-w-[1320px] px-[clamp(16px,3vw,32px)] pt-6 pb-[72px]">
            <Outlet />
          </main>
        </div>
      </div>
    </ItemFormProvider>
  );
}

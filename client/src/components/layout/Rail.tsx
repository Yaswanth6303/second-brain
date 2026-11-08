import { NavLink } from "react-router";

const LINKS = [
  { to: "/library", icon: "bi-collection", label: "Library" },
  { to: "/inbox", icon: "bi-inbox", label: "Shared with me" },
  { to: "/friends", icon: "bi-people", label: "Friends" },
  { to: "/groups", icon: "bi-diagram-3", label: "Groups" },
  { to: "/profile", icon: "bi-person-circle", label: "Profile" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `group flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[.92rem] font-medium no-underline ${
    isActive ? "bg-brand-soft text-brand font-semibold" : "text-ink hover:bg-surface-2"
  }`;

// Left navigation. Collections and top tags join it in stage 2.
export function Rail({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex min-h-full flex-col gap-5 px-3 py-4 lg:py-5">
      <div className="flex items-center justify-between">
        <div className="font-display flex items-center gap-2.5 px-2 text-[1.15rem] font-bold">
          <span className="bg-mark text-mark-ink grid size-8 flex-none place-items-center rounded-[9px] text-base">
            <i className="bi bi-bookmarks-fill" />
          </span>
          Second Brain
        </div>
        <button
          type="button"
          className="btn-icon lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>
      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} className={linkClass} onClick={onClose}>
            {({ isActive }) => (
              <>
                <i
                  className={`bi ${l.icon} text-[1.05rem] ${isActive ? "text-brand" : "text-muted"}`}
                />
                <span className="min-w-0 flex-1">{l.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

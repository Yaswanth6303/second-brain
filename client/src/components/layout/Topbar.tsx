import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useTheme } from "../../context/ThemeContext.tsx";
import { useAuth } from "../../features/auth/index.ts";
import { useItemForm } from "../../features/library/index.ts";
import { Bell } from "../../features/notifications/index.ts";
import { Avatar } from "../ui/Avatar.tsx";
import { Button } from "../ui/Button.tsx";
import { Dropdown, MenuItem } from "../ui/Dropdown.tsx";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const search = useRef<HTMLInputElement>(null);
  const form = useItemForm();
  const { pathname } = useLocation();
  const [sp] = useSearchParams();
  const onLibrary = pathname === "/library";
  // Search filters the library; typing elsewhere jumps to it, as in the prototype.
  const onSearch = (q: string) => {
    const next = new URLSearchParams(onLibrary ? sp : undefined);
    if (q) next.set("q", q);
    else next.delete("q");
    void navigate({ pathname: "/library", search: next.toString() }, { replace: onLibrary });
  };

  // "/" focuses search, as in the prototype.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!user) return null;
  return (
    <header className="bg-bg border-line sticky top-[env(safe-area-inset-top,0px)] z-[1020] flex items-center gap-2 border-b px-[clamp(16px,3vw,32px)] py-2.5">
      <button type="button" className="btn-icon lg:hidden" aria-label="Open menu" onClick={onMenu}>
        <i className="bi bi-list" />
      </button>
      <div className="bg-surface border-line text-muted focus-within:border-brand flex max-w-[520px] min-w-0 flex-1 items-center gap-2 rounded-[10px] border px-2.5">
        <i className="bi bi-search" />
        <input
          ref={search}
          type="search"
          placeholder="Search names, tags and notes"
          aria-label="Search your library"
          value={onLibrary ? (sp.get("q") ?? "") : ""}
          onChange={(e) => onSearch(e.target.value)}
          className="text-ink min-w-0 flex-1 border-0 bg-transparent py-2 outline-0"
        />
        <kbd className="bg-surface-2 text-muted hidden rounded-[5px] px-1.5 py-px font-mono text-[.72rem] md:inline">
          /
        </kbd>
      </div>
      <span className="hidden flex-1 md:block" />
      <Button onClick={() => form.openNew()}>
        <i className="bi bi-plus-lg" />
        <span className="hidden sm:inline">Add link</span>
      </Button>
      <Bell />
      <button
        type="button"
        className="btn-icon"
        aria-label="Switch between light and dark"
        onClick={toggle}
      >
        <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`} />
      </button>
      <Dropdown
        label="Account menu"
        triggerClassName="rounded-full"
        trigger={<Avatar name={user.name} hue={user.hue} size={34} />}
      >
        {(close) => (
          <div role="menu">
            <h3 className="text-muted px-4 py-2 text-[.875rem] font-normal">
              {user.name} · @{user.handle}
            </h3>
            <MenuItem icon="bi-person" onClick={() => (close(), void navigate("/profile"))}>
              Profile
            </MenuItem>
            <MenuItem icon="bi-share" onClick={() => (close(), void navigate("/profile/shared"))}>
              Who I shared with
            </MenuItem>
            <MenuItem icon="bi-gear" onClick={() => (close(), void navigate("/profile/settings"))}>
              Settings
            </MenuItem>
            <hr className="border-line my-2" />
            <MenuItem
              icon="bi-box-arrow-right"
              onClick={() => void logout().then(() => navigate("/login"))}
            >
              Log out
            </MenuItem>
          </div>
        )}
      </Dropdown>
    </header>
  );
}

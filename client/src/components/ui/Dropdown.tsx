import { type ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  className?: string;
  children: (close: () => void) => ReactNode;
};

// Click-to-open menu that closes on outside click or Esc; replaces Bootstrap's dropdown.
export function Dropdown({
  label,
  trigger,
  triggerClassName = "btn-icon",
  className = "",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={triggerClassName}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`bg-surface border-line absolute top-full right-0 z-[1000] mt-0.5 rounded-[0.6rem] border py-2 text-[0.9rem] shadow-[0_10px_30px_rgba(0,0,0,.12)] ${className}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: string;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`hover:bg-surface-2 flex w-full items-center gap-[.6rem] px-4 py-1 text-left whitespace-nowrap ${danger ? "text-danger" : "text-ink"}`}
    >
      <i className={`bi ${icon}`} />
      {children}
    </button>
  );
}

import { type ReactNode, useEffect, useId, useRef } from "react";
import { Button } from "./Button.tsx";

type Props = {
  title: string;
  submitLabel: string;
  cancelLabel?: string;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  danger?: boolean;
  busy?: boolean;
  children: ReactNode;
};

// Native <dialog>: the browser handles focus trapping, Esc and the backdrop.
export function Modal({
  title,
  submitLabel,
  cancelLabel = "Cancel",
  onClose,
  onSubmit,
  danger,
  busy,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => ref.current?.showModal(), []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="bg-surface text-ink border-line m-auto w-[calc(100%-1rem)] max-w-[500px] rounded-[0.9rem] border p-0 backdrop:bg-black/50"
    >
      <form
        noValidate
        className="flex max-h-[calc(100dvh-3.5rem)] flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <div className="border-line flex items-center justify-between border-b px-4 py-3">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
        <div className="border-line flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant={danger ? "danger" : "primary"} disabled={busy}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-line text-muted flex flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-dashed px-5 py-9 text-center">
      <i className={`bi ${icon} text-[1.8rem]`} />
      <h2 className="text-ink">{title}</h2>
      <p className="mb-0">{text}</p>
      {action}
    </div>
  );
}

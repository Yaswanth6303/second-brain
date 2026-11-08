export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="bg-surface-2 h-1.5 overflow-hidden rounded-full"
    >
      <div className="bg-brand h-full" style={{ width: `${value}%` }} />
    </div>
  );
}

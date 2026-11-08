type Tab<K extends string> = { key: K; label: string; count?: number };

// The prototype's underlined tabs, as an ARIA tab list.
export function Tabs<K extends string>({
  tabs,
  current,
  onChange,
}: {
  tabs: Tab<K>[];
  current: K;
  onChange: (k: K) => void;
}) {
  return (
    <div role="tablist" className="border-line mb-6 flex gap-5 overflow-x-auto border-b">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={current === t.key}
          onClick={() => onChange(t.key)}
          className={`-mb-px border-b-2 py-2 font-semibold whitespace-nowrap ${current === t.key ? "border-brand text-ink" : "text-muted hover:text-ink border-transparent"}`}
        >
          {t.label}
          {t.count !== undefined && <span className="n ml-1">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

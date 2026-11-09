'use client';

export function Tabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${selected ? 'border-teal-700 text-navy-900' : 'border-transparent text-muted hover:text-ink'}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

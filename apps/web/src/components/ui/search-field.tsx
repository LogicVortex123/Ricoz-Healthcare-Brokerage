import { Search } from 'lucide-react';

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  label = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-line bg-white pr-3 pl-10 text-sm outline-none"
      />
    </label>
  );
}

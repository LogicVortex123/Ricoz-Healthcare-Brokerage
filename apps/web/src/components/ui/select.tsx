import { cn } from '@/lib/cn';

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-sm outline-none disabled:bg-sand-100',
        props.className,
      )}
    />
  );
}

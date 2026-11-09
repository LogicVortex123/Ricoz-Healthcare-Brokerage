import { cn } from '@/lib/cn';

const control =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-sm outline-none placeholder:text-muted/80 disabled:bg-sand-100';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

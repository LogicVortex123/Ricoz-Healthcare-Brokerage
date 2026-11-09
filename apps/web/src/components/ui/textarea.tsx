import { cn } from '@/lib/cn';

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-28 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-sm outline-none placeholder:text-muted/80',
        props.className,
      )}
    />
  );
}

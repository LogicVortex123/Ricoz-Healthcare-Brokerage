import { cn } from '@/lib/cn';

export function FilterPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <aside className={cn('space-y-4 rounded-xl border border-line bg-white p-5 shadow-sm lg:sticky lg:self-start', className)}>{children}</aside>;
}

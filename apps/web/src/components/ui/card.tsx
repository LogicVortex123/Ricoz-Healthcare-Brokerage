import { cn } from '@/lib/cn';
import type { CSSProperties } from 'react';

export function Card({ className, interactive = false, style, children }: { className?: string; interactive?: boolean; style?: CSSProperties; children: React.ReactNode }) {
  return (
    <div className={cn('reveal rounded-xl border border-line bg-white p-5 shadow-sm transition duration-300', interactive && 'hover:-translate-y-1 hover:border-teal-700/30 hover:shadow-lg', className)} style={style}>
      {children}
    </div>
  );
}

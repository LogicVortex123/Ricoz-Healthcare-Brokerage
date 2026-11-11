'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export function Dropdown({
  label,
  children,
  align = 'right',
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-navy-900 hover:bg-sand-100"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'motion-pop absolute z-30 mt-2 min-w-64 rounded-xl border border-line bg-white p-2 shadow-md',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({ href, onClick, children }: { href?: string; onClick?: () => void; children: React.ReactNode }) {
  const className = 'block w-full rounded-lg px-3 py-2.5 text-left text-base text-ink transition hover:bg-teal-100';
  if (href) {
    return (
      <Link href={href} role="menuitem" className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" className={className} onClick={onClick}>
      {children}
    </button>
  );
}

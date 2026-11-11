'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function NavigationProgress() {
  const pathname = usePathname();
  const first = useRef(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), reduce ? 200 : 800);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60]" role="status" aria-live="polite">
      <div className="load-bar" />
      <p className="mx-auto mt-3 w-fit rounded-full bg-navy-950 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">Loading</p>
    </div>
  );
}

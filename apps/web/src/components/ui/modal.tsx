'use client';

import { useEffect } from 'react';

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button className="motion-fade absolute inset-0 bg-navy-950/50" aria-label="Close dialog" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="motion-pop relative w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-md">
        <h2 id="dialog-title" className="font-serif text-2xl text-navy-900">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

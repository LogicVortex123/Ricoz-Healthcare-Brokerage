'use client';

import { useEffect } from 'react';

export function Atmosphere() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        document.documentElement.style.setProperty('--scroll-y', String(window.scrollY));
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="atmosphere" aria-hidden="true">
      <span className="orb-slot orb-slot-a"><span className="orb orb-teal" /></span>
      <span className="orb-slot orb-slot-b"><span className="orb orb-coral" /></span>
      <span className="orb-slot orb-slot-c"><span className="orb orb-sky" /></span>
      <span className="orb-slot orb-slot-d"><span className="orb orb-gold" /></span>
    </div>
  );
}

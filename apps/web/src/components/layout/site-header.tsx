'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AccountMenu } from '@/components/layout/account-menu';
import { Logo } from '@/components/brand/logo';

const links = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/practices', label: 'Practices' },
  { href: '/#sellers', label: 'For sellers' },
  { href: '/#buyers', label: 'For buyers' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem('pb-signing-out');
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div className="h-1.5 bg-gradient-to-r from-teal-700 via-sky-700 to-coral-700" />
      <div className="border-b border-line/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-[15px] font-semibold text-navy-800 lg:flex" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? 'nav-link text-teal-800' : 'nav-link transition hover:text-teal-800'}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:block">
            <AccountMenu />
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white lg:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open ? (
          <div className="motion-slide border-t border-line bg-sand-50 px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-base font-semibold hover:bg-white" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <div className="mt-3">
                <AccountMenu compact onNavigate={() => setOpen(false)} />
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}

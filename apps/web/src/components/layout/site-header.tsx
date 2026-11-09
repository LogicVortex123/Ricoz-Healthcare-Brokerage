'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-provider';
import { homeFor } from '@/lib/constants';

const links = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/practices', label: 'Practices' },
  { href: '/#sellers', label: 'For sellers' },
  { href: '/#buyers', label: 'For buyers' },
];

export function SiteHeader() {
  const { user, status } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-sand-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-navy-800 md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? 'text-teal-800' : 'hover:text-teal-800'}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {status === 'ready' && user ? (
            <Button href={homeFor(user.role)} variant="secondary" size="sm">
              Dashboard
            </Button>
          ) : (
            <Button href="/sign-in" variant="ghost" size="sm">
              Sign in
            </Button>
          )}
          <Button href="/sign-up?role=SELLER" size="sm">
            List your practice
          </Button>
        </div>
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-lg md:hidden" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-line px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-sm font-semibold" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Button href={user ? homeFor(user.role) : '/sign-in'} variant="secondary" className="mt-2" onClick={() => setOpen(false)}>
              {user ? 'Dashboard' : 'Sign in'}
            </Button>
            <Button href="/sign-up?role=SELLER" className="mt-2">
              List your practice
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

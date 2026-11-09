'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, ClipboardList, Compass, LayoutDashboard, LogOut, Menu, Plus, UserRound, Users, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { useAuth } from '@/features/auth/auth-provider';
import { api } from '@/lib/api';
import { homeFor, profileFor, type Role } from '@/lib/constants';
import { cn } from '@/lib/cn';

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; match: (pathname: string, status: string | null) => boolean };

const navigation: Record<Role, Item[]> = {
  SELLER: [
    { href: '/dashboard/seller', label: 'Overview', icon: LayoutDashboard, match: (pathname) => pathname === '/dashboard/seller' },
    { href: '/dashboard/seller/practices', label: 'My practices', icon: Building2, match: (pathname) => pathname.startsWith('/dashboard/seller/practices') && !pathname.endsWith('/new') },
    { href: '/dashboard/seller/practices/new', label: 'Create listing', icon: Plus, match: (pathname) => pathname.endsWith('/practices/new') },
    { href: '/dashboard/seller/inquiries', label: 'Buyer inquiries', icon: ClipboardList, match: (pathname) => pathname.startsWith('/dashboard/seller/inquiries') },
    { href: '/dashboard/seller/profile', label: 'Profile', icon: UserRound, match: (pathname) => pathname.startsWith('/dashboard/seller/profile') },
  ],
  BUYER: [
    { href: '/dashboard/buyer', label: 'Overview', icon: LayoutDashboard, match: (pathname) => pathname === '/dashboard/buyer' },
    { href: '/dashboard/buyer/explore', label: 'Explore practices', icon: Compass, match: (pathname) => pathname.startsWith('/dashboard/buyer/explore') },
    { href: '/dashboard/buyer/inquiries', label: 'My inquiries', icon: ClipboardList, match: (pathname) => pathname.startsWith('/dashboard/buyer/inquiries') },
    { href: '/dashboard/buyer/profile', label: 'Profile', icon: UserRound, match: (pathname) => pathname.startsWith('/dashboard/buyer/profile') },
  ],
  ADMIN: [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, match: (pathname) => pathname === '/dashboard/admin' },
    { href: '/dashboard/admin/listings?status=PENDING_REVIEW', label: 'Pending listings', icon: ClipboardList, match: (pathname, status) => pathname.startsWith('/dashboard/admin/listings') && status === 'PENDING_REVIEW' },
    { href: '/dashboard/admin/listings', label: 'All listings', icon: Building2, match: (pathname, status) => pathname.startsWith('/dashboard/admin/listings') && status !== 'PENDING_REVIEW' },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users, match: (pathname) => pathname.startsWith('/dashboard/admin/users') },
    { href: '/dashboard/admin/inquiries', label: 'Inquiries', icon: ClipboardList, match: (pathname) => pathname.startsWith('/dashboard/admin/inquiries') },
  ],
  BROKER: [
    { href: '/dashboard/broker', label: 'Overview', icon: LayoutDashboard, match: (pathname) => pathname === '/dashboard/broker' },
    { href: '/practices', label: 'Approved practices', icon: Compass, match: (pathname) => pathname.startsWith('/practices') },
  ],
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, status, setUser } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [trackedPath, setTrackedPath] = useState(pathname);
  if (trackedPath !== pathname) {
    setTrackedPath(pathname);
    setOpen(false);
  }
  const listingStatus = searchParams.get('status');

  useEffect(() => {
    if (status === 'ready' && !user) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, user, router, pathname]);

  async function signOut() {
    await api('/api/auth/logout', { method: 'POST', json: {} });
    setUser(null);
    router.replace('/');
  }

  if (status !== 'ready' || !user) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading your workspace…</div>;
  }

  const items = navigation[user.role];

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 text-sand-100">
      <div className="flex h-16 items-center px-5">
        <Logo light />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Dashboard">
        {items.map((item) => {
          const active = item.match(pathname, listingStatus);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold', active ? 'bg-white/10 text-white' : 'text-sand-200 hover:bg-white/5 hover:text-white')}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="px-5 pb-5 text-xs leading-5 text-sand-200/80">Signed in as {user.role === 'ADMIN' ? 'administrator' : user.role.toLowerCase()}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-sand-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-navy-950/50" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[80vw]">{sidebar}</div>
        </div>
      ) : null}
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-lg lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <p className="hidden text-sm text-muted lg:block">Healthcare practice transitions</p>
          <Dropdown
            label={
              <span className="max-w-40 truncate">
                {user.name}
              </span>
            }
          >
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <DropdownItem href={profileFor(user.role)}>Profile</DropdownItem>
            <DropdownItem href={homeFor(user.role)}>Overview</DropdownItem>
            <DropdownItem onClick={() => void signOut()}>
              <span className="inline-flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Sign out
              </span>
            </DropdownItem>
          </Dropdown>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

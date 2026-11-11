'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, Building2, ClipboardList, Compass, LayoutDashboard, LogOut, Menu, Plus, UserRound, Users, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { RouteLoading } from '@/components/ui/route-loading';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
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
    { href: '/dashboard/buyer/saved', label: 'Saved practices', icon: Bookmark, match: (pathname) => pathname.startsWith('/dashboard/buyer/saved') },
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
    { href: '/dashboard/broker', label: 'Assigned practices', icon: Building2, match: (pathname) => pathname.startsWith('/dashboard/broker') },
    { href: '/practices', label: 'Marketplace', icon: Compass, match: (pathname) => pathname.startsWith('/practices') },
  ],
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, status, setUser } = useAuth();
  const { push } = useToast();
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
    if (sessionStorage.getItem('pb-signing-out') === '1') return;
    if (status === 'ready' && !user) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, user, router, pathname]);

  async function signOut() {
    sessionStorage.setItem('pb-signing-out', '1');
    try {
      await api('/api/auth/logout', { method: 'POST', json: {} });
      setUser(null);
      router.replace('/');
    } catch {
      sessionStorage.removeItem('pb-signing-out');
      push('Sign out did not complete. Try again.', 'error');
    }
  }

  if (status !== 'ready' || !user) {
    return <RouteLoading title="Loading your workspace" />;
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
              className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium', active ? 'bg-white text-navy-950' : 'text-sand-200 hover:bg-white/10 hover:text-white')}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="px-5 pb-3 text-xs leading-5 text-sand-200/80">Signed in as {user.role === 'ADMIN' ? 'administrator' : user.role.toLowerCase()}</p>
      <button type="button" className="mx-3 mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-sand-100 transition hover:bg-white/10" onClick={() => void signOut()}>
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-navy-950/50" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[80vw]">{sidebar}</div>
        </div>
      ) : null}
      <div className="min-w-0">
        <header className="border-b border-line bg-white">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">{user.role === 'ADMIN' ? 'Administration' : user.role === 'BROKER' ? 'Broker' : user.role === 'BUYER' ? 'Buyer' : 'Seller'}</p>
                <p className="hidden text-base font-semibold text-navy-900 sm:block">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dropdown
                label={
                  <span className="account-chip inline-flex items-center gap-2 rounded-full border border-line bg-sand-50 py-1 pr-2 pl-1">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
                    <span className="max-w-36 truncate text-sm font-semibold">{user.name}</span>
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
                  <span className="inline-flex items-center gap-2 text-coral-700">
                    <LogOut className="h-4 w-4" /> Sign out
                  </span>
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </header>
        <main id="main" className="motion-slide mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

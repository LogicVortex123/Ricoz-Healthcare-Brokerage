'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/auth-provider';
import { api } from '@/lib/api';
import { homeFor, profileFor } from '@/lib/constants';

function initials(name: string) {
  const letters = name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return letters || 'PB';
}

function roleLabel(role: string) {
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'BROKER') return 'Broker';
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function AccountMenu({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  const { user, status, setUser } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  async function signOut() {
    try {
      await api('/api/auth/logout', { method: 'POST', json: {} });
      setUser(null);
      onNavigate?.();
      router.replace('/');
    } catch {
      push('Sign out did not complete. Try again.', 'error');
    }
  }

  if (status !== 'ready') {
    return <span className="text-sm text-muted">Checking session…</span>;
  }

  if (!user) {
    return (
      <div className={compact ? 'flex flex-col gap-2' : 'flex items-center gap-2'}>
        <Button href="/sign-in" variant="ghost" size="sm" onClick={onNavigate}>
          Sign in
        </Button>
        <Button href="/sign-up?role=SELLER" size="sm" onClick={onNavigate}>
          List your practice
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-3">
        <p className="text-base font-semibold text-navy-900">{user.name}</p>
        <p className="truncate text-sm text-muted">{user.email}</p>
        <Button href={homeFor(user.role)} variant="secondary" onClick={onNavigate}>Dashboard</Button>
        <Button href={profileFor(user.role)} variant="secondary" onClick={onNavigate}>Profile</Button>
        <Button variant="danger" onClick={() => void signOut()}>Sign out</Button>
      </div>
    );
  }

  return (
    <Dropdown
      label={
        <span className="account-chip inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pr-2 pl-1">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">{initials(user.name)}</span>
          <span className="hidden max-w-32 truncate text-left sm:block">
            <span className="block text-sm leading-4 font-semibold text-navy-900">{user.name}</span>
            <span className="block text-[11px] leading-4 font-medium text-teal-800">{roleLabel(user.role)}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted" />
        </span>
      }
    >
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-ink">{user.name}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <DropdownItem href={homeFor(user.role)}>
        <span className="inline-flex items-center gap-2" onClick={onNavigate}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </span>
      </DropdownItem>
      <DropdownItem href={profileFor(user.role)}>
        <span className="inline-flex items-center gap-2">
          <UserRound className="h-4 w-4" /> Profile
        </span>
      </DropdownItem>
      <DropdownItem onClick={() => void signOut()}>
        <span className="inline-flex items-center gap-2 text-coral-700">
          <LogOut className="h-4 w-4" /> Sign out
        </span>
      </DropdownItem>
    </Dropdown>
  );
}

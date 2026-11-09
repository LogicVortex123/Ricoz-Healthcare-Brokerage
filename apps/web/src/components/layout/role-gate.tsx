'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-provider';
import { homeFor, type Role } from '@/lib/constants';

export function RoleGate({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { user, status } = useAuth();
  if (status !== 'ready' || !user) return null;
  if (!allow.includes(user.role)) {
    return (
      <div className="rounded-xl border border-line bg-white p-8">
        <h1 className="font-serif text-3xl text-navy-900">This page is for a different account type</h1>
        <p className="mt-2 text-sm text-muted">Open the dashboard that matches the role you signed in with.</p>
        <Button className="mt-5" href={homeFor(user.role)}>Go to your dashboard</Button>
      </div>
    );
  }
  return children;
}

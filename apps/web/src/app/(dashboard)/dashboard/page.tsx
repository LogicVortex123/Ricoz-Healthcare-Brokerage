'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { homeFor } from '@/lib/constants';

export default function DashboardIndex() {
  const { user, status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === 'ready' && user) router.replace(homeFor(user.role));
  }, [status, user, router]);
  return <p className="text-sm text-muted">Opening your dashboard…</p>;
}

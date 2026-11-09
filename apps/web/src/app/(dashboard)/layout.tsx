import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted">Loading your workspace…</div>}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}

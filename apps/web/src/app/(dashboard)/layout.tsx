import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RouteLoading } from '@/components/ui/route-loading';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RouteLoading title="Loading your workspace" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}

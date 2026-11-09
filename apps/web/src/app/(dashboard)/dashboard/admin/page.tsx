import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { AdminOverview } from '@/features/dashboard/overviews';

export const metadata: Metadata = { title: 'Admin overview' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Administration" title="Overview" description="Review counts are calculated from accounts, listings, and inquiries in the database." />
      <AdminOverview />
    </div>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeading } from '@/components/ui/page-heading';
import { AdminListings } from '@/features/admin/admin-views';

export const metadata: Metadata = { title: 'Listings' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Administration" title="Listings" description="Open a listing to approve it or send it back with a reason." />
      <Suspense fallback={<p className="text-sm text-muted">Loading listings…</p>}>
        <AdminListings />
      </Suspense>
    </div>
  );
}

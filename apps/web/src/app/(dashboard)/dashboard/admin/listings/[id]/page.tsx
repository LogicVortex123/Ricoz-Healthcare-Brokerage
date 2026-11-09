import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { AdminListingReview } from '@/features/admin/admin-views';

export const metadata: Metadata = { title: 'Review listing' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Administration" title="Review listing" description="Approval makes the listing visible to buyers. Rejection keeps it private and shows the seller your reason." />
      <AdminListingReview id={id} />
    </div>
  );
}

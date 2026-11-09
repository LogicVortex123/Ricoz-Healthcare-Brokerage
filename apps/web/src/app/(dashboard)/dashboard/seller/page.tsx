import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { SellerOverview } from '@/features/dashboard/overviews';

export const metadata: Metadata = { title: 'Seller overview' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Seller" title="Overview" description="Counts come from your practices and the inquiries buyers have sent." />
      <SellerOverview />
    </div>
  );
}

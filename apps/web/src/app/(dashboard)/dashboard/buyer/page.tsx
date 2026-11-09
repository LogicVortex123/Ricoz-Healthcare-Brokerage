import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { BuyerOverview } from '@/features/dashboard/overviews';

export const metadata: Metadata = { title: 'Buyer overview' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Buyer" title="Overview" description="Available listings are approved practices. Your inquiry counts update when you contact a seller." />
      <BuyerOverview />
    </div>
  );
}

import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { Marketplace } from '@/features/listings/marketplace';

export const metadata: Metadata = { title: 'Explore practices' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Buyer" title="Explore practices" description="Search approved dental, veterinary, and specialist medical listings." />
      <Marketplace />
    </div>
  );
}

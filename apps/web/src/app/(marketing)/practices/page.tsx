import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { Marketplace } from '@/features/listings/marketplace';

export const metadata: Metadata = { title: 'Practices' };

export default function PracticesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeading
        eyebrow="Marketplace"
        title="Practices open for transition"
        description="Every listing on this page has been approved. Drafts and pending submissions are not included."
      />
      <Marketplace />
    </div>
  );
}

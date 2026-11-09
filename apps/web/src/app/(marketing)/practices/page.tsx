import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { Marketplace } from '@/features/listings/marketplace';

export const metadata: Metadata = { title: 'Practices' };

export default function PracticesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-navy-900 via-coral-700 to-sky-700 px-6 py-10 text-white shadow-lg sm:px-10">
        <PageHeading
          tone="dark"
          eyebrow="Marketplace"
          title="Practices open for transition"
          description="Every listing on this page has been approved. Drafts and pending submissions are not included."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <p className="reveal from-left rounded-2xl bg-teal-100 px-4 py-4 text-base leading-6 text-navy-900">Only reviewed listings appear here.</p>
        <p className="reveal rounded-2xl bg-gold-100 px-4 py-4 text-base leading-6 text-navy-900" style={{ transitionDelay: '80ms' }}>You see the city and region, not a street address.</p>
        <p className="reveal from-right rounded-2xl bg-coral-100 px-4 py-4 text-base leading-6 text-navy-900" style={{ transitionDelay: '160ms' }}>One active inquiry is enough to introduce yourself.</p>
      </div>
      <Marketplace />
    </div>
  );
}

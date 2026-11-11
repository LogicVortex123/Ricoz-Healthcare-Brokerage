import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { InquiryThread } from '@/features/deals/inquiry-thread';

export const metadata: Metadata = { title: 'Inquiry thread' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Negotiation" title="Inquiry thread" description="Messages and offers stay with the people on this inquiry. An accepted offer is a proposal, not a transfer of ownership." />
      <InquiryThread inquiryId={id} />
    </div>
  );
}

import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { InquiryList } from '@/features/inquiries/inquiry-list';

export const metadata: Metadata = { title: 'Buyer inquiries' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Seller" title="Buyer inquiries" description="You can see the buyer’s name and email. Their message should not contain patient information." />
      <InquiryList audience="seller" />
    </div>
  );
}

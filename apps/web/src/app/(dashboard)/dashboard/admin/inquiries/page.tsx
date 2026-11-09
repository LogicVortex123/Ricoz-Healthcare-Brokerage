import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { InquiryList } from '@/features/inquiries/inquiry-list';

export const metadata: Metadata = { title: 'Inquiries' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Administration" title="Inquiries" description="Review buyer introductions. Status changes are made by the seller." />
      <InquiryList audience="admin" />
    </div>
  );
}

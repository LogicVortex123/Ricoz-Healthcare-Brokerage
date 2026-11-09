import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { InquiryList } from '@/features/inquiries/inquiry-list';

export const metadata: Metadata = { title: 'My inquiries' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Buyer" title="My inquiries" description="Each practice can have one active inquiry. A closed inquiry can be followed by a new one." />
      <InquiryList audience="buyer" />
    </div>
  );
}

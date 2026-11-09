import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { PracticeDetail } from '@/features/practices/practice-views';

export const metadata: Metadata = { title: 'Practice' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Seller" title="Practice details" description="Track the review status and the inquiries that belong to this practice." />
      <PracticeDetail id={id} />
    </div>
  );
}

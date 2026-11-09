import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { PracticeEditor } from '@/features/practices/practice-editor';

export const metadata: Metadata = { title: 'Edit practice' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Seller" title="Edit practice" description="Saving a withdrawn listing returns it to draft. Pending and approved listings stay locked." />
      <PracticeEditor id={id} />
    </div>
  );
}

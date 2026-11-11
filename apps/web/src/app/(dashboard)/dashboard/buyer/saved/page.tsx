import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { SavedList } from '@/features/deals/saved-list';

export const metadata: Metadata = { title: 'Saved practices' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Buyer" title="Saved practices" description="Approved practices you chose to keep. A withdrawn or unapproved listing drops off this list." />
      <SavedList />
    </div>
  );
}

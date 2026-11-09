import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/ui/page-heading';
import { PracticeList } from '@/features/practices/practice-views';

export const metadata: Metadata = { title: 'My practices' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Seller" title="My practices" description="Drafts remain private until you submit them and an administrator approves them." action={<Button href="/dashboard/seller/practices/new">Create listing</Button>} />
      <PracticeList />
    </div>
  );
}

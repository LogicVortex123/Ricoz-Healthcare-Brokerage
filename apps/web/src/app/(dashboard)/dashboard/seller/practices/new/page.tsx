import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { PracticeForm } from '@/features/practices/practice-form';

export const metadata: Metadata = { title: 'Create listing' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Seller" title="Create a listing" description="A name and category are enough to save a draft. Submit only when the practice description is ready for review." />
      <PracticeForm />
    </div>
  );
}

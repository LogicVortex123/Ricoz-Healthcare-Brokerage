import type { Metadata } from 'next';
import { ListingDetail } from '@/features/listings/listing-detail';

export const metadata: Metadata = { title: 'Practice listing' };

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="px-4 py-10 sm:px-6">
      <ListingDetail id={id} />
    </div>
  );
}

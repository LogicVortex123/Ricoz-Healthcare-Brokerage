import type { Metadata } from 'next';
import { RoleGate } from '@/components/layout/role-gate';
import { PageHeading } from '@/components/ui/page-heading';
import { DealRoom } from '@/features/deals/deal-room';

export const metadata: Metadata = { title: 'Deal room' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RoleGate allow={['BROKER']}>
      <div className="space-y-6">
        <PageHeading eyebrow="Broker" title="Deal room" description="Confidential notes and the closing list for an assigned practice." />
        <DealRoom practiceId={id} />
      </div>
    </RoleGate>
  );
}

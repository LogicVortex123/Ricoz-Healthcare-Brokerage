import type { Metadata } from 'next';
import { RoleGate } from '@/components/layout/role-gate';
import { PageHeading } from '@/components/ui/page-heading';
import { BrokerDesk } from '@/features/deals/broker-desk';

export const metadata: Metadata = { title: 'Assigned practices' };

export default function Page() {
  return (
    <RoleGate allow={['BROKER']}>
      <div className="space-y-6">
        <PageHeading eyebrow="Broker" title="Assigned practices" description="You see only the practices an administrator has assigned. You can keep notes moving. You cannot approve a listing." />
        <BrokerDesk />
      </div>
    </RoleGate>
  );
}

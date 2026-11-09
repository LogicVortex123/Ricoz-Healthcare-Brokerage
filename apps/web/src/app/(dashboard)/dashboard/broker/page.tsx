import type { Metadata } from 'next';
import { RoleGate } from '@/components/layout/role-gate';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/ui/page-heading';

export const metadata: Metadata = { title: 'Broker workspace' };

export default function Page() {
  return (
    <RoleGate allow={['BROKER']}>
      <div className="space-y-6">
        <PageHeading eyebrow="Broker" title="Broker workspace" description="Broker assignment and transaction coordination are planned for a later phase. You can review the approved marketplace now." />
        <Button href="/practices">View approved practices</Button>
      </div>
    </RoleGate>
  );
}

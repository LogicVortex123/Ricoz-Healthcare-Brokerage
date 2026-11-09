import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { AdminUsers } from '@/features/admin/admin-views';

export const metadata: Metadata = { title: 'Users' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Administration" title="Users" description="Passwords are stored only as hashes and are not shown here. Roles cannot be changed from this screen." />
      <AdminUsers />
    </div>
  );
}

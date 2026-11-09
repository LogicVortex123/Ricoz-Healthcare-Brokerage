import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { ProfileForm } from '@/features/account/profile-form';

export const metadata: Metadata = { title: 'Profile' };

export default function AdminProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Administration" title="Profile" />
      <ProfileForm />
    </div>
  );
}

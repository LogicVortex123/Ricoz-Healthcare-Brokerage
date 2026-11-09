import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { ProfileForm } from '@/features/account/profile-form';

export const metadata: Metadata = { title: 'Profile' };

export default function BuyerProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Buyer" title="Profile" description="Sellers see your name and email when you send an inquiry." />
      <ProfileForm />
    </div>
  );
}

import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { ProfileForm } from '@/features/account/profile-form';

export const metadata: Metadata = { title: 'Profile' };

export default function SellerProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Seller" title="Profile" description="This information is shown to a buyer only where an inquiry permits it." />
      <ProfileForm />
    </div>
  );
}

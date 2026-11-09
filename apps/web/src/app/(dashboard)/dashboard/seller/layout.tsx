import { RoleGate } from '@/components/layout/role-gate';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={['SELLER']}>{children}</RoleGate>;
}

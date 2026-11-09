import { RoleGate } from '@/components/layout/role-gate';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={['BUYER']}>{children}</RoleGate>;
}

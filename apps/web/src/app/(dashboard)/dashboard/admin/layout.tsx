import { RoleGate } from '@/components/layout/role-gate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={['ADMIN']}>{children}</RoleGate>;
}

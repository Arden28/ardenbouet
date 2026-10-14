// app/admin/layout.tsx — persistent admin frame (sidebar survives navigation between admin pages)
import { AdminFrame } from '@/components/admin/AdminShell';

export const metadata = { title: 'Admin · Arden BOUET', robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}

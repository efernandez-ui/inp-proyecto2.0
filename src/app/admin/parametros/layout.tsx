import { ParametrosShell } from '@/components/admin/parametros/ParametrosShell';

export default function ParametrosLayout({ children }: { children: React.ReactNode }) {
  return <ParametrosShell>{children}</ParametrosShell>;
}

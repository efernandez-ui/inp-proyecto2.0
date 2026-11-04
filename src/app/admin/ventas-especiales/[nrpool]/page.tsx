import { VentasEspecialesEditSection } from '@/components/admin/ventas-especiales';

type Props = { params: { nrpool: string } | Promise<{ nrpool: string }> };

export default async function AdminVentaEspecialEditPage({ params }: Props) {
  const p = await params;
  const id = Number(p.nrpool);
  return <VentasEspecialesEditSection nrpool={id} />;
}

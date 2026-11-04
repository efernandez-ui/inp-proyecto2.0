'use client';

import PendientesConsolidadoModal from './PendientesConsolidadoModal';
import type { PedidoListItem, PedidoPendienteProducto } from '@/services/pedidos';

export default function PendientesPorPedidoDrawer({
  open,
  onClose,
  pedido,
  items,
  loading,
  nrocta,
  onManaged,
}: {
  open: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
  items: PedidoPendienteProducto[];
  loading: boolean;
  nrocta?: string;
  onManaged?: () => void | Promise<void>;
}) {
  return (
    <PendientesConsolidadoModal
      open={open}
      onClose={onClose}
      pedido={pedido}
      items={items}
      loading={loading}
      nrocta={nrocta}
      onManaged={onManaged}
      title="Detalle de productos no entregados"
      subtitle=""
    />
  );
}

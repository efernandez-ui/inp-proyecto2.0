'use client';

import PendientesConsolidadoModal from './PendientesConsolidadoModal';
import type { PedidoPendienteProducto } from '@/services/pedidos';

export default function PendientesProductoDrawer({
  open,
  onClose,
  items,
  loading,
  nrocta,
  onManaged,
}: {
  open: boolean;
  onClose: () => void;
  items: PedidoPendienteProducto[];
  loading: boolean;
  nrocta?: string;
  onManaged?: () => void | Promise<void>;
}) {
  return (
    <PendientesConsolidadoModal
      open={open}
      onClose={onClose}
      items={items}
      loading={loading}
      nrocta={nrocta}
      onManaged={onManaged}
      title="Consolidado de productos no entregados"
      subtitle=""
    />
  );
}

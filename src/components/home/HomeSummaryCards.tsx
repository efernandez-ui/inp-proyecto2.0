'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { RootState } from '@/store';
import PendientesProductoDrawer from '@/components/pedidos/PendientesProductoDrawer';
import { isStaff } from '@/utils/auth';
import {
  fetchPendientesProducto,
  type PedidoPendienteProducto,
} from '@/services/pedidos';
import {
  formatHomeDate,
  formatSaldoArs,
  getHomeResumen,
  type HomeResumen,
} from '@/services/home';

interface CardConfig {
  title: string;
  value: string;
  subtitle?: string | null;
  href?: string;
  linkLabel: string;
  openPendientes?: boolean;
}

function buildCards(resumen: HomeResumen | null): CardConfig[] {
  const saldoVencido = resumen?.saldoVencido ?? null;
  const promedio =
    saldoVencido != null && saldoVencido > 0 && resumen?.promedioDiasVencido != null
      ? `Prom. ${resumen.promedioDiasVencido} días`
      : null;

  return [
    {
      title: 'Saldo vencido',
      value: formatSaldoArs(saldoVencido),
      subtitle: promedio,
      href: '/cuenta-corriente',
      linkLabel: 'Ver más',
    },
    {
      title: 'Carritos activos',
      value: String(resumen?.carritosActivos ?? 0),
      href: '/carrito',
      linkLabel: 'Ver carrito',
    },
    {
      title: 'Productos no entregados',
      value: `${resumen?.pedidosPendientes ?? 0} u`,
      subtitle: `${resumen?.pendientesConStock ?? 0} con stock`,
      linkLabel: 'Ver productos',
      openPendientes: true,
    },
    {
      title: 'Última compra',
      value: formatHomeDate(resumen?.ultimaCompraFecha),
      href: '/pedidos',
      linkLabel: 'Ver detalle',
    },
  ];
}

const linkClass =
  'text-xs font-bold text-[#93B931] hover:text-white transition-colors';

export default function HomeSummaryCards() {
  const { user, selectedClient } = useSelector((state: RootState) => state.auth);
  const [resumen, setResumen] = useState<HomeResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendientesOpen, setPendientesOpen] = useState(false);
  const [pendientes, setPendientes] = useState<PedidoPendienteProducto[]>([]);
  const [pendientesLoading, setPendientesLoading] = useState(false);

  const nrocta =
    isStaff(user) && selectedClient?.nrocta ? selectedClient.nrocta : undefined;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getHomeResumen(nrocta)
      .then((data) => {
        if (mounted) {
          setResumen(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [nrocta]);

  const loadPendientes = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setPendientesLoading(true);
    try {
      const [rows, data] = await Promise.all([
        fetchPendientesProducto(token, nrocta),
        getHomeResumen(nrocta),
      ]);
      setPendientes(rows);
      setResumen(data);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar productos pendientes');
    } finally {
      setPendientesLoading(false);
    }
  }, [nrocta]);

  const openPendientes = async () => {
    if (resumen?.needsClientSelection) {
      toast.info('Seleccione un cliente para ver los productos pendientes.');
      return;
    }
    setPendientesOpen(true);
    await loadPendientes();
  };

  const cards = buildCards(resumen);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] rounded-lg bg-[#001f3f]/20 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
  <div>
      {resumen?.needsClientSelection && (
        <p className="mb-3 text-sm text-gray-600">
          Seleccione un cliente para ver el resumen de cuenta y pedidos.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg bg-[#001f3f] px-5 py-4 text-white shadow-md min-h-[120px] flex flex-col"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              {card.title}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight truncate">
              {card.value}
            </p>
            {card.subtitle ? (
              <p className="mt-0.5 text-xs text-white/70 truncate">{card.subtitle}</p>
            ) : null}
            <div className="mt-auto pt-3">
              {card.openPendientes ? (
                <button type="button" onClick={() => void openPendientes()} className={linkClass}>
                  {card.linkLabel}
                </button>
              ) : (
                <Link href={card.href ?? '/'} className={linkClass}>
                  {card.linkLabel}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      <PendientesProductoDrawer
        open={pendientesOpen}
        onClose={() => setPendientesOpen(false)}
        items={pendientes}
        loading={pendientesLoading}
        nrocta={nrocta}
        onManaged={loadPendientes}
      />
    </div>
  );
}

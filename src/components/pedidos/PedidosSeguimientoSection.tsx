'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { RootState } from '@/store';
import { isStaff } from '@/utils/auth';
import {
  fetchPedidoDetalle,
  fetchPedidos,
  fetchPendientesPorPedido,
  fetchPendientesProducto,
  PEDIDOS_PAGE_SIZE,
  type PedidoCircomInstancia,
  type PedidoDetalle,
  type PedidoListItem,
  type PedidoPendienteProducto,
  type PedidosListResponse,
} from '@/services/pedidos';
import PedidoCard from './PedidoCard';
import PedidoDetalleDrawer from './PedidoDetalleDrawer';
import PendientesPorPedidoDrawer from './PendientesPorPedidoDrawer';
import PendientesProductoDrawer from './PendientesProductoDrawer';
import {
  defaultInstanciaStep,
  stepToCircom,
  type PedidoInstanciaStep,
} from './pedidoSteps';

const SEARCH_BRAND = '#001f3f';
const inputClass =
  'mt-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#001f3f] outline-none focus:border-[#1a79ff] focus:ring-2 focus:ring-[#1a79ff]/15';

function detalleCacheKey(
  pedido: Pick<PedidoListItem, 'modfor' | 'codfor' | 'nrofor'>,
  circom: PedidoCircomInstancia,
) {
  return `${pedido.modfor}|${pedido.codfor}|${pedido.nrofor}|${circom}`;
}

/** Header-only detalle for FACTURADO/ENVIADO (UI loads comprobantes/repartos separately). */
function lightDetalleFromList(pedido: PedidoListItem, nrocta?: string): PedidoDetalle {
  return {
    modfor: pedido.modfor,
    codfor: pedido.codfor,
    nrofor: pedido.nrofor,
    idVisible: pedido.idVisible,
    fecha: pedido.fecha,
    nrocta: nrocta ?? '',
    etapa: pedido.etapa,
    etapaLabel: pedido.etapaLabel,
    items: [],
  };
}

/** etapa viene del listado (TVF); Softland usa circom, no etapa. */
function withEtapaFromList(detalle: PedidoDetalle, pedido: PedidoListItem): PedidoDetalle {
  return {
    ...detalle,
    etapa: pedido.etapa,
    etapaLabel: pedido.etapaLabel,
  };
}

export default function PedidosSeguimientoSection() {
  const { user, selectedClient } = useSelector((s: RootState) => s.auth);
  const staff = isStaff(user);
  const nrocta = staff ? selectedClient?.nrocta : user?.nrocta;
  const needsClient = staff && !nrocta;

  const [nroInput, setNroInput] = useState('');
  const [fechaDesdeInput, setFechaDesdeInput] = useState('');
  const [fechaHastaInput, setFechaHastaInput] = useState('');
  const [appliedNro, setAppliedNro] = useState('');
  const [appliedFechaDesde, setAppliedFechaDesde] = useState('');
  const [appliedFechaHasta, setAppliedFechaHasta] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PedidosListResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<PedidoListItem | null>(null);
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleStep, setDetalleStep] = useState<PedidoInstanciaStep>('RECIBIDO');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const detalleCacheRef = useRef<Map<string, PedidoDetalle>>(new Map());

  const [pendientesOpen, setPendientesOpen] = useState(false);
  const [pendientes, setPendientes] = useState<PedidoPendienteProducto[]>([]);
  const [pendientesLoading, setPendientesLoading] = useState(false);

  const [pendientesPedido, setPendientesPedido] = useState<PedidoListItem | null>(null);
  const [pendientesPedidoItems, setPendientesPedidoItems] = useState<PedidoPendienteProducto[]>([]);
  const [pendientesPedidoLoading, setPendientesPedidoLoading] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token || needsClient) return;
    setLoading(true);
    try {
      const res = await fetchPedidos(
        token,
        nrocta,
        appliedNro || undefined,
        appliedFechaDesde || undefined,
        appliedFechaHasta || undefined,
        page,
        PEDIDOS_PAGE_SIZE,
      );
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [nrocta, needsClient, appliedNro, appliedFechaDesde, appliedFechaHasta, page]);

  useEffect(() => {
    setPage(0);
    detalleCacheRef.current.clear();
  }, [nrocta]);

  useEffect(() => {
    if (needsClient) {
      setData(null);
      detalleCacheRef.current.clear();
      return;
    }
    load();
  }, [load, needsClient]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    detalleCacheRef.current.clear();
    setAppliedNro(nroInput.trim());
    setAppliedFechaDesde(fechaDesdeInput);
    setAppliedFechaHasta(fechaHastaInput);
  };

  const loadDetalle = useCallback(
    async (pedido: PedidoListItem, step: PedidoInstanciaStep, token: string) => {
      if (step === 'FACTURADO' || step === 'ENVIADO') {
        setDetalle(lightDetalleFromList(pedido, nrocta));
        setDetalleLoading(false);
        return;
      }
      const circom = stepToCircom(step);
      const key = detalleCacheKey(pedido, circom);
      const cached = detalleCacheRef.current.get(key);
      if (cached) {
        setDetalle(withEtapaFromList(cached, pedido));
        setDetalleLoading(false);
        return;
      }
      setDetalleLoading(true);
      try {
        const d = await fetchPedidoDetalle(
          token,
          pedido.modfor,
          pedido.codfor,
          pedido.nrofor,
          nrocta,
          pedido.etapa,
          undefined,
          circom,
        );
        const merged = withEtapaFromList(d, pedido);
        detalleCacheRef.current.set(key, merged);
        setDetalle(merged);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error al cargar el detalle');
        throw e;
      } finally {
        setDetalleLoading(false);
      }
    },
    [nrocta],
  );

  const openDetalle = async (pedido: PedidoListItem, step?: PedidoInstanciaStep) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setAuthToken(token);
    setSelected(pedido);
    const instancia = step ?? defaultInstanciaStep(pedido.etapa);
    setDetalleStep(instancia);
    setDetalle(null);
    try {
      await loadDetalle(pedido, instancia, token);
    } catch {
      setSelected(null);
    }
  };

  const openPendientes = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setPendientesOpen(true);
    setPendientesLoading(true);
    try {
      setPendientes(await fetchPendientesProducto(token, nrocta));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar no entregados');
    } finally {
      setPendientesLoading(false);
    }
  };

  const openPendientesPedido = async (pedido: PedidoListItem) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setPendientesPedido(pedido);
    setPendientesPedidoItems([]);
    setPendientesPedidoLoading(true);
    try {
      setPendientesPedidoItems(
        await fetchPendientesPorPedido(
          token,
          pedido.modfor,
          pedido.codfor,
          pedido.nrofor,
          nrocta,
          undefined,
          'ALL',
        ),
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar no entregados del pedido');
      setPendientesPedido(null);
    } finally {
      setPendientesPedidoLoading(false);
    }
  };

  const refreshAfterGestion = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token || needsClient) return;
    detalleCacheRef.current.clear();
    const tasks: Promise<void>[] = [
      fetchPedidos(
        token,
        nrocta,
        appliedNro || undefined,
        appliedFechaDesde || undefined,
        appliedFechaHasta || undefined,
        page,
        PEDIDOS_PAGE_SIZE,
      )
        .then((res) => {
          setData(res);
        })
        .catch(() => {
          /* list load errors already toasted elsewhere */
        }),
    ];
    if (pendientesOpen) {
      setPendientesLoading(true);
      tasks.push(
        fetchPendientesProducto(token, nrocta)
          .then((rows) => {
            setPendientes(rows);
          })
          .catch((e: unknown) => {
            toast.error(e instanceof Error ? e.message : 'Error al refrescar no entregados');
          })
          .finally(() => {
            setPendientesLoading(false);
          }),
      );
    }
    if (pendientesPedido) {
      setPendientesPedidoLoading(true);
      const pedido = pendientesPedido;
      tasks.push(
        fetchPendientesPorPedido(
          token,
          pedido.modfor,
          pedido.codfor,
          pedido.nrofor,
          nrocta,
          undefined,
          'ALL',
        )
          .then((rows) => {
            setPendientesPedidoItems(rows);
          })
          .catch((e: unknown) => {
            toast.error(e instanceof Error ? e.message : 'Error al refrescar no entregados del pedido');
          })
          .finally(() => {
            setPendientesPedidoLoading(false);
          }),
      );
    }
    await Promise.all(tasks);
  }, [
    needsClient,
    nrocta,
    appliedNro,
    appliedFechaDesde,
    appliedFechaHasta,
    page,
    pendientesOpen,
    pendientesPedido,
  ]);

  if (needsClient) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-sm font-bold text-amber-900">
          Seleccione un cliente para ver pedidos y seguimiento
        </p>
      </div>
    );
  }

  const pedidos = data?.pedidos ?? [];
  const unidadesPendientes = Number(data?.pendientesUnidades ?? 0);
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.page ?? page;
  const showPagination = totalPages > 1;
  const paginationBtnClass =
    'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40';

  return (
    <div>
      <h1 className="sr-only">Pedidos y seguimiento</h1>
      <form
        onSubmit={onSearch}
        aria-label="Filtros de pedidos"
        className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[10rem] flex-1 flex-col text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Número de pedido
            <input
              value={nroInput}
              onChange={(e) => setNroInput(e.target.value)}
              className={inputClass}
              placeholder="Número de pedido"
            />
          </label>
          <label className="flex min-w-[9rem] flex-col text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Desde
            <input
              type="date"
              value={fechaDesdeInput}
              onChange={(e) => setFechaDesdeInput(e.target.value)}
              max={fechaHastaInput || undefined}
              className={inputClass}
            />
          </label>
          <label className="flex min-w-[9rem] flex-col text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Hasta
            <input
              type="date"
              value={fechaHastaInput}
              onChange={(e) => setFechaHastaInput(e.target.value)}
              min={fechaDesdeInput || undefined}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold uppercase tracking-wide text-white hover:opacity-90"
            style={{ backgroundColor: SEARCH_BRAND }}
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
          <p className="ml-auto text-xs font-medium text-slate-500">
            Mostrando <strong className="text-[#001f3f]">{pedidos.length}</strong> de {totalElements}{' '}
            registro{totalElements === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            onClick={openPendientes}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-400 px-3 text-xs font-bold text-amber-950 transition hover:bg-amber-500"
          >
            Productos no entregados
            <span className="rounded-full bg-amber-950 px-1.5 py-0.5 text-[10px] text-white">
              {Math.round(unidadesPendientes)}
            </span>
          </button>
        </div>
      </form>

      {loading && !data && <p className="py-12 text-center text-gray-500">Cargando pedidos…</p>}

      <div className="space-y-4">
        {pedidos.map((p) => (
          <PedidoCard
            key={`${p.modfor}-${p.codfor}-${p.nrofor}`}
            pedido={p}
            onOpen={(step) => openDetalle(p, step)}
            onOpenPendientes={() => openPendientesPedido(p)}
          />
        ))}
        {!loading && pedidos.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            No hay pedidos para mostrar con esos filtros.
          </div>
        )}
      </div>

      {showPagination && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
          <button
            type="button"
            disabled={loading || currentPage <= 0}
            onClick={() => setPage(Math.max(0, currentPage - 1))}
            className={paginationBtnClass}
          >
            Anterior
          </button>
          <span className="text-xs font-bold text-gray-600">
            Página {totalPages === 0 ? 0 : currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={loading || currentPage >= totalPages - 1}
            onClick={() => setPage(currentPage + 1)}
            className={paginationBtnClass}
          >
            Siguiente
          </button>
        </div>
      )}

      <PedidoDetalleDrawer
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setDetalle(null);
          setDetalleStep('RECIBIDO');
        }}
        detalle={detalle}
        loading={detalleLoading}
        nrocta={nrocta}
        token={authToken}
        instanciaStep={detalleStep}
      />
      <PendientesPorPedidoDrawer
        open={!!pendientesPedido}
        onClose={() => {
          setPendientesPedido(null);
          setPendientesPedidoItems([]);
        }}
        pedido={pendientesPedido}
        items={pendientesPedidoItems}
        loading={pendientesPedidoLoading}
        nrocta={nrocta}
        onManaged={refreshAfterGestion}
      />
      <PendientesProductoDrawer
        open={pendientesOpen}
        onClose={() => setPendientesOpen(false)}
        items={pendientes}
        loading={pendientesLoading}
        nrocta={nrocta}
        onManaged={refreshAfterGestion}
      />
    </div>
  );
}

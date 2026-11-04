'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers, Search, ShoppingCart, Trash2, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { AppDispatch, RootState } from '@/store';
import { loadFullCart } from '@/store/cartSlice';
import type { PedidoListItem, PedidoPendienteProducto } from '@/services/pedidos';
import {
  eliminarPendientes,
  enviarPendientes,
  formatPedidoArs,
} from '@/services/pedidos';
import { fetchSustitutos, getProductById } from '@/services/products';
import StockItem from '@/components/catalog/StockItem';
import ProductosVinculadosModal from '@/components/catalog/ProductosVinculadosModal';
import { NESTED_MODAL_Z_INDEX_CLASS } from '@/components/modals/modalStack';
import type { ProductoDTO } from '@/interfaces/producto';
import { branchStockFromList } from '@/utils/stockBattery';
import { extractErrorMessage } from '@/utils/apiError';
import { PEDIDO_BRAND, PEDIDO_BRAND_DARK } from './pedidoSteps';

const BRANCHES = ['NOA', 'NEA', 'BUE', 'CUY'] as const;

type StockSnap = {
  stock?: { sucursal?: string; cantidad?: unknown; estado?: string | null }[] | null;
  stockNoa?: unknown;
  stockNea?: unknown;
  stockBue?: unknown;
  stockCuy?: unknown;
  hasSustitutos?: boolean;
};

type RowState = PedidoPendienteProducto & {
  _key: string;
  _pendienteOriginal: number;
};

function rowKey(it: PedidoPendienteProducto, idx: number) {
  return `${it.tippro}|${it.artcod}|${it.deposito ?? ''}|${it.precio ?? ''}|${idx}`;
}

/** Agrupa por tippro+artcod, sumando cantidad, pendiente e importeTotal. */
function groupPendientes(items: PedidoPendienteProducto[]): PedidoPendienteProducto[] {
  const map = new Map<string, PedidoPendienteProducto>();
  for (const it of items) {
    const key = `${it.tippro}|${it.artcod}`;
    const prev = map.get(key);
    const cant = Number(it.cantidad ?? 0);
    const pend = Number(it.pendiente ?? 0);
    const precio = Number(it.precio ?? 0);
    const importe =
      it.importeTotal != null && Number.isFinite(Number(it.importeTotal))
        ? Number(it.importeTotal)
        : importeFor(pend, precio);
    if (!prev) {
      map.set(key, {
        ...it,
        cantidad: cant,
        pendiente: pend,
        importeTotal: importe,
        deposito: undefined,
        depositoNombre: undefined,
      });
      continue;
    }
    const nextCant = Number(prev.cantidad ?? 0) + cant;
    const nextPend = Number(prev.pendiente ?? 0) + pend;
    const nextImporte = Number(prev.importeTotal ?? 0) + importe;
    const nextPrecio =
      Number(prev.precio ?? 0) > 0 ? Number(prev.precio) : precio;
    map.set(key, {
      ...prev,
      cantidad: nextCant,
      pendiente: nextPend,
      precio: nextPrecio,
      importeTotal: nextImporte,
    });
  }
  return Array.from(map.values());
}

function importeFor(pendiente: number, precio: number) {
  const p = Number.isFinite(pendiente) ? Math.max(0, pendiente) : 0;
  const pr = Number.isFinite(precio) ? precio : 0;
  return p * pr;
}

export default function PendientesConsolidadoModal({
  open,
  onClose,
  pedido,
  items,
  loading,
  nrocta,
  onManaged,
  title = 'Consolidado de productos no entregados',
  subtitle = '',
}: {
  open: boolean;
  onClose: () => void;
  pedido?: PedidoListItem | null;
  items: PedidoPendienteProducto[];
  loading: boolean;
  nrocta?: string;
  /** Refetch listado / modales tras enviar o eliminar. */
  onManaged?: () => void | Promise<void>;
  title?: string;
  subtitle?: string;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const userTipo = useSelector((s: RootState) => s.auth.user?.tipo);
  const verStock = useSelector((s: RootState) => s.auth.user?.verStock);
  const activeCartId = useSelector((s: RootState) => s.cart.activeCartId);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockBySku, setStockBySku] = useState<Record<string, StockSnap>>({});
  const [rows, setRows] = useState<RowState[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  const [sustitutosModalOpen, setSustitutosModalOpen] = useState(false);
  const [sustitutosModalTitle, setSustitutosModalTitle] = useState('Productos sustitutos');
  const [sustitutosItems, setSustitutosItems] = useState<ProductoDTO[]>([]);
  const [sustitutosLoading, setSustitutosLoading] = useState(false);

  const filteredKeys = useMemo(() => rows.map((r) => r._key), [rows]);
  const allFilteredSelected =
    filteredKeys.length > 0 && filteredKeys.every((k) => selected.has(k));

  const totalSeleccionado = useMemo(() => {
    return rows
      .filter((r) => selected.has(r._key))
      .reduce((acc, r) => acc + Number(r.importeTotal ?? 0), 0);
  }, [rows, selected]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setStockBySku({});
      setRows([]);
      setSelected(new Set());
      return;
    }
    let list = groupPendientes(items);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (it) =>
          it.descripcion?.toLowerCase().includes(q) ||
          `${it.tippro}${it.artcod}`.toLowerCase().includes(q) ||
          it.nropar?.toLowerCase().includes(q) ||
          String(it.nroforOrigen ?? '').includes(q),
      );
    }
    setRows(
      list.map((it, idx) => {
        const pend = Math.max(0, Number(it.pendiente ?? 0));
        const safePend = Number.isFinite(pend) ? pend : 0;
        return {
          ...it,
          pendiente: safePend,
          importeTotal: importeFor(safePend, Number(it.precio ?? 0)),
          _key: rowKey(it, idx),
          _pendienteOriginal: safePend,
        };
      }),
    );
    setSelected(new Set());
  }, [open, items, searchQuery, pedido?.nrofor]);

  const stockSkuKeys = useMemo(
    () => Array.from(new Set(rows.map((it) => `${it.tippro}|${it.artcod}`))).slice(0, 50).join(','),
    [rows],
  );

  useEffect(() => {
    if (!open || !stockSkuKeys) return;
    let cancelled = false;
    const keys = stockSkuKeys.split(',');

    (async () => {
      const next: Record<string, StockSnap> = {};
      await Promise.all(
        keys.map(async (key) => {
          const [tippro, artcod] = key.split('|');
          try {
            const p = await getProductById(tippro, artcod, nrocta);
            if (!p || cancelled) return;
            next[key] = {
              stock: p.stock,
              stockNoa: p.stockNoa,
              stockNea: p.stockNea,
              stockBue: p.stockBue,
              stockCuy: p.stockCuy,
              hasSustitutos: p.tieneSustitutos === 'S' || p.hasSustitutos === true,
            };
          } catch {
            /* ignore */
          }
        }),
      );
      if (!cancelled) setStockBySku((prev) => ({ ...prev, ...next }));
    })();

    return () => {
      cancelled = true;
    };
  }, [open, stockSkuKeys, nrocta]);

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filteredKeys));
  };

  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updatePendiente = (key: string, raw: string) => {
    const n = Number(raw);
    const pendiente = Number.isFinite(n) && n >= 0 ? n : 0;
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;
        const precio = Number(r.precio ?? 0);
        return {
          ...r,
          pendiente,
          importeTotal: importeFor(pendiente, precio),
        };
      }),
    );
  };

  const handleOpenSustitutos = async (it: PedidoPendienteProducto) => {
    setSustitutosModalTitle(`Sustitutos para ${it.descripcion || `${it.tippro}${it.artcod}`}`);
    setSustitutosItems([]);
    setSustitutosLoading(true);
    setSustitutosModalOpen(true);
    try {
      const data = await fetchSustitutos(it.tippro, it.artcod, nrocta);
      setSustitutosItems(data || []);
    } catch {
      toast.error('Error al cargar productos sustitutos');
    } finally {
      setSustitutosLoading(false);
    }
  };

  const onEnviar = async () => {
    if (selected.size === 0) {
      toast.info('Seleccioná al menos un no entregado');
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Debés iniciar sesión');
      return;
    }
    const picked = rows.filter((r) => selected.has(r._key));
    setActionLoading(true);
    try {
      const res = await enviarPendientes(token, {
        nrocta,
        cartId: activeCartId ?? undefined,
        items: picked.map((r) => ({
          tippro: r.tippro,
          artcod: r.artcod,
          pendienteOriginal: Number(r._pendienteOriginal ?? 0),
          cantidadSolicitada: Number(r.pendiente ?? 0),
          modforOrigen: r.modforOrigen ?? pedido?.modfor,
          codforOrigen: r.codforOrigen ?? pedido?.codfor,
          nroforOrigen: r.nroforOrigen ?? pedido?.nrofor,
        })),
      });
      toast.success(res.mensaje || 'No entregados enviados al carrito');
      const cartIdToRefresh = res.cartId ?? activeCartId;
      if (cartIdToRefresh != null) {
        await dispatch(loadFullCart({ id: cartIdToRefresh, token, refresh: true }));
      }
      setSelected(new Set());
      setActionLoading(false);
      void onManaged?.();
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e, 'No se pudieron enviar los no entregados'));
      setActionLoading(false);
    }
  };

  const onEliminar = async () => {
    if (selected.size === 0) {
      toast.info('Seleccioná al menos un no entregado');
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Debés iniciar sesión');
      return;
    }
    const picked = rows.filter((r) => selected.has(r._key));
    setActionLoading(true);
    try {
      const res = await eliminarPendientes(token, {
        nrocta,
        items: picked.map((r) => ({
          tippro: r.tippro,
          artcod: r.artcod,
          pendienteOriginal: Number(r._pendienteOriginal ?? r.pendiente ?? 0),
          ...(pedido
            ? {
                modforOrigen: r.modforOrigen ?? pedido.modfor,
                codforOrigen: r.codforOrigen ?? pedido.codfor,
                nroforOrigen: r.nroforOrigen ?? pedido.nrofor,
              }
            : {}),
        })),
      });
      toast.success(res.mensaje || 'No entregados eliminados');
      setSelected(new Set());
      setActionLoading(false);
      void onManaged?.();
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e, 'No se pudieron eliminar los no entregados'));
      setActionLoading(false);
    }
  };

  const dynamicTitle = title;
  const dynamicSubtitle = subtitle;

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-5">
            <motion.div
              aria-label="Cerrar modal"
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex max-h-[92vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl ring-1 ring-black/10"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="flex items-start justify-between gap-4 px-5 py-4 text-white sm:px-6"
                style={{ backgroundColor: PEDIDO_BRAND_DARK }}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold sm:text-lg">{dynamicTitle}</h2>
                    {dynamicSubtitle ? (
                      <p className="mt-1 text-xs text-slate-300">{dynamicSubtitle}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b px-5 py-3 sm:px-6">
                <div className="relative max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto, código o N° de parte…"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-[#1a79ff] focus:ring-2 focus:ring-[#1a79ff]/15"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto px-4 py-3 sm:px-6">
                {loading ? (
                  <p className="text-sm font-semibold text-slate-500">Cargando no entregados…</p>
                ) : rows.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {searchQuery
                      ? 'No se encontraron no entregados con los filtros aplicados.'
                      : 'No hay unidades no entregadas para mostrar.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[900px] w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                        <tr>
                          <th className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              onChange={toggleAll}
                              aria-label="Seleccionar todos"
                            />
                          </th>
                          <th className="px-3 py-3">Código</th>
                          <th className="px-3 py-3">Descripción</th>
                          <th className="px-3 py-3">Stock regional</th>
                          <th className="px-3 py-3">Sustituto</th>
                          <th className="px-3 py-3 text-center">Cant.</th>
                          <th className="px-3 py-3 text-right">Precio</th>
                          <th className="px-3 py-3 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((r) => {
                          const skuKey = `${r.tippro}|${r.artcod}`;
                          const snap = stockBySku[skuKey];
                          const codigo = `${r.tippro}${r.artcod}`;
                          return (
                            <tr key={r._key} className="align-top bg-white hover:bg-slate-50/80">
                              <td className="px-3 py-3 align-middle">
                                <input
                                  type="checkbox"
                                  checked={selected.has(r._key)}
                                  onChange={() => toggleOne(r._key)}
                                  aria-label={`Seleccionar ${codigo}`}
                                />
                              </td>
                              <td className="px-3 py-3 font-mono">
                                <strong className="block text-slate-900">{codigo}</strong>
                                {r.nropar ? (
                                  <span className="block text-slate-500">{r.nropar}</span>
                                ) : null}
                              </td>
                              <td className="px-3 py-3 font-semibold text-slate-900">
                                {r.descripcion || codigo}
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <div className="flex flex-wrap gap-1">
                                  {BRANCHES.map((label) => {
                                    const fallback =
                                      label === 'NOA'
                                        ? snap?.stockNoa
                                        : label === 'NEA'
                                          ? snap?.stockNea
                                          : label === 'BUE'
                                            ? snap?.stockBue
                                            : snap?.stockCuy;
                                    const branch = branchStockFromList(
                                      snap?.stock ?? undefined,
                                      label,
                                      fallback,
                                    );
                                    return (
                                      <StockItem
                                        key={label}
                                        label={label}
                                        stock={branch.cantidad}
                                        estado={branch.estado}
                                        userTipo={userTipo}
                                        verStock={verStock}
                                      />
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                {snap?.hasSustitutos ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleOpenSustitutos(r)}
                                    className="text-xs font-bold hover:underline"
                                    style={{ color: PEDIDO_BRAND }}
                                  >
                                    Ver sustituto
                                  </button>
                                ) : null}
                              </td>
                              <td className="px-3 py-3 align-middle text-center">
                                <input
                                  type="number"
                                  min={0}
                                  step="1"
                                  value={
                                    Number.isFinite(Number(r.pendiente))
                                      ? String(Math.round(Number(r.pendiente)))
                                      : String(Math.round(Number(r._pendienteOriginal ?? 0)))
                                  }
                                  onChange={(e) => updatePendiente(r._key, e.target.value)}
                                  aria-label={`Cantidad ${codigo}`}
                                  className="w-16 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-center font-bold tabular-nums text-rose-700 outline-none focus:border-rose-400"
                                />
                              </td>
                              <td className="px-3 py-3 align-middle text-right tabular-nums text-slate-700">
                                {formatPedidoArs(Number(r.precio ?? 0))}
                              </td>
                              <td className="px-3 py-3 align-middle text-right font-bold tabular-nums text-slate-900">
                                {formatPedidoArs(Number(r.importeTotal ?? 0))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onEnviar()}
                    disabled={actionLoading || selected.size === 0}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: PEDIDO_BRAND }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {actionLoading ? 'Procesando…' : 'Añadir al carrito actual'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onEliminar()}
                    disabled={actionLoading || selected.size === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Solicitar baja
                  </button>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-500">
                    {selected.size} seleccionado{selected.size === 1 ? '' : 's'}
                  </p>
                  <p className="font-bold text-[#001f3f]">
                    Seleccionado: {formatPedidoArs(totalSeleccionado)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProductosVinculadosModal
        isOpen={sustitutosModalOpen}
        onClose={() => setSustitutosModalOpen(false)}
        title={sustitutosModalTitle}
        items={sustitutosItems}
        loading={sustitutosLoading}
        overlayZIndexClass={NESTED_MODAL_Z_INDEX_CLASS}
      />
    </>
  );
}

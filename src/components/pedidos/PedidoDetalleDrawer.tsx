'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';
import type {
  PedidoComprobante,
  PedidoDetalle,
  PedidoItem,
  PedidoReparto,
} from '@/services/pedidos';
import {
  fetchPedidoComprobantes,
  fetchPedidoRepartos,
  formatPedidoArs,
  formatPedidoFecha,
  formatPedidoFechaCorta,
} from '@/services/pedidos';
import { instanciaStepLabel, PEDIDO_BRAND, PEDIDO_BRAND_DARK, type PedidoInstanciaStep } from './pedidoSteps';

function depositoOptions(items: PedidoItem[]) {
  const map = new Map<string, string>();
  for (const it of items) {
    const code = (it.deposito || '').trim();
    if (!code) continue;
    if (!map.has(code)) {
      map.set(code, (it.depositoNombre || code).trim());
    }
  }
  return Array.from(map.entries())
    .map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

/** Agrupa por tippro+artcod sumando cantidades; el filtro de depósito solo acota el set. */
function groupItems(items: PedidoItem[], depositoFilter: string): PedidoItem[] {
  const filtered = depositoFilter
    ? items.filter((it) => (it.deposito || '').trim() === depositoFilter)
    : items;
  const map = new Map<string, PedidoItem>();
  for (const it of filtered) {
    const key = `${it.tippro}|${it.artcod}`;
    const prev = map.get(key);
    const cantAdd = Number(it.cantidad ?? 0);
    const pendAdd = Number(it.cantidadPendiente ?? 0);
    const subAdd = Number(it.subtotal ?? cantAdd * Number(it.precioUnitario ?? 0));
    if (!prev) {
      map.set(key, {
        ...it,
        cantidad: cantAdd,
        cantidadPendiente: pendAdd,
        subtotal: subAdd,
        deposito: depositoFilter || undefined,
        depositoNombre: depositoFilter
          ? it.depositoNombre || it.deposito
          : undefined,
      });
      continue;
    }
    const cant = Number(prev.cantidad ?? 0) + cantAdd;
    const pend = Number(prev.cantidadPendiente ?? 0) + pendAdd;
    const subtotal = Number(prev.subtotal ?? 0) + subAdd;
    const precio =
      Number(prev.precioUnitario ?? 0) > 0
        ? Number(prev.precioUnitario)
        : Number(it.precioUnitario ?? 0);
    map.set(key, {
      ...prev,
      cantidad: cant,
      cantidadPendiente: pend,
      precioUnitario: precio,
      subtotal,
    });
  }
  return Array.from(map.values());
}

/**
 * Softland: Cant. = pendiente de procesar por instancia (circom). etapa TVF solo label/repartos.
 * FACTURADO: comprobantes (diseño Ema / inp InvoicedOrderContent).
 * UI: modal centrado por instancia, no drawer lateral.
 */
export default function PedidoDetalleDrawer({
  open,
  onClose,
  detalle,
  loading,
  nrocta,
  token,
  instanciaStep,
}: {
  open: boolean;
  onClose: () => void;
  detalle: PedidoDetalle | null;
  loading: boolean;
  nrocta?: string;
  token?: string | null;
  instanciaStep: PedidoInstanciaStep;
}) {
  const rawItems = detalle?.items ?? [];
  const instanciaLabel = instanciaStepLabel(instanciaStep);
  const showRepartos = instanciaStep === 'ENVIADO';
  const showComprobantes = instanciaStep === 'FACTURADO';
  const showPresupuesto = instanciaStep === 'RECIBIDO';
  /** Depósito / leyenda Cant. solo en preparación (inp); no en recibido ni análisis. */
  const showDepositoUi = instanciaStep === 'PREPARACION';
  const [depositoFilter, setDepositoFilter] = useState('');
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const options = useMemo(() => depositoOptions(rawItems), [rawItems]);
  const items = useMemo(
    () => groupItems(rawItems, depositoFilter),
    [rawItems, depositoFilter],
  );

  const total = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.subtotal ?? 0), 0),
    [items],
  );
  const presupuestoTotal = useMemo(
    () => rawItems.reduce((acc, item) => acc + Number(item.subtotal ?? 0), 0),
    [rawItems],
  );
  const unidadesPendientes = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.cantidad ?? item.cantidadPendiente ?? 0), 0),
    [items],
  );
  const hayPendientes = unidadesPendientes > 0;

  const [repartos, setRepartos] = useState<PedidoReparto[]>([]);
  const [repartosLoading, setRepartosLoading] = useState(false);

  const [comprobantes, setComprobantes] = useState<PedidoComprobante[]>([]);
  const [comprobantesLoading, setComprobantesLoading] = useState(false);
  const [activeComprobante, setActiveComprobante] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setDepositoFilter('');
      return;
    }
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    setDepositoFilter('');
    setActiveComprobante(0);
  }, [detalle?.modfor, detalle?.codfor, detalle?.nrofor, instanciaStep]);

  useEffect(() => {
    if (!open || !detalle || !showRepartos || !token) {
      setRepartos([]);
      return;
    }
    let cancelled = false;
    setRepartosLoading(true);
    fetchPedidoRepartos(token, detalle.modfor, detalle.codfor, detalle.nrofor, nrocta)
      .then((rows) => {
        if (!cancelled) setRepartos(rows);
      })
      .catch(() => {
        if (!cancelled) setRepartos([]);
      })
      .finally(() => {
        if (!cancelled) setRepartosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, detalle?.modfor, detalle?.codfor, detalle?.nrofor, showRepartos, token, nrocta]);

  useEffect(() => {
    if (!open || !detalle || !showComprobantes || !token) {
      setComprobantes([]);
      return;
    }
    let cancelled = false;
    setComprobantesLoading(true);
    fetchPedidoComprobantes(token, detalle.modfor, detalle.codfor, detalle.nrofor, nrocta)
      .then((rows) => {
        if (!cancelled) {
          setComprobantes(rows);
          setActiveComprobante(0);
        }
      })
      .catch(() => {
        if (!cancelled) setComprobantes([]);
      })
      .finally(() => {
        if (!cancelled) setComprobantesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, detalle?.modfor, detalle?.codfor, detalle?.nrofor, showComprobantes, token, nrocta]);

  const invoice =
    comprobantes.length > 0
      ? comprobantes[Math.min(activeComprobante, comprobantes.length - 1)]
      : null;

  const subtitleParts = [
    detalle?.idVisible ? `Pedido ${detalle.idVisible}` : null,
    detalle ? `Alta ${formatPedidoFecha(detalle.fecha)}` : null,
    detalle?.nrocta ? `Cta. ${detalle.nrocta}` : null,
    !showComprobantes && !showPresupuesto && unidadesPendientes > 0
      ? `${Math.round(unidadesPendientes)} u. no entregadas`
      : null,
  ].filter(Boolean);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={instanciaLabel}
        className="flex max-h-[92vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl"
      >
        <div
          className="flex shrink-0 items-start justify-between gap-4 px-5 py-4 text-white"
          style={{ backgroundColor: PEDIDO_BRAND_DARK }}
        >
          <div className="min-w-0">
            <h2 className="text-base font-bold sm:text-lg">{instanciaLabel}</h2>
            {subtitleParts.length > 0 && (
              <p className="mt-1 text-xs text-slate-300">{subtitleParts.join(' · ')}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5 sm:p-6">
          {showPresupuesto && (
            <section className="flex min-h-0 flex-1 flex-col gap-5">
              <div className="grid shrink-0 gap-5 px-1 text-xs lg:grid-cols-[1fr_1fr]">
                <dl className="grid grid-cols-[130px_1fr] content-start gap-x-3 gap-y-2">
                  <dt className="font-bold text-slate-500">Nro. pedido:</dt>
                  <dd className="font-bold" style={{ color: PEDIDO_BRAND_DARK }}>
                    {detalle?.idVisible || '—'}
                  </dd>
                  <dt className="font-bold text-slate-500">Fecha:</dt>
                  <dd className="font-medium text-slate-700">
                    {detalle ? formatPedidoFechaCorta(detalle.fecha) : '—'}
                  </dd>
                  <dt className="font-bold text-slate-500">Cliente:</dt>
                  <dd className="font-bold text-slate-700">{detalle?.cliente || '—'}</dd>
                  <dt className="font-bold text-slate-500">Dirección:</dt>
                  <dd className="font-medium text-slate-700">{detalle?.direccion || '—'}</dd>
                </dl>
                <label className="font-bold text-slate-500">
                  Notas:
                  <textarea
                    aria-label="Notas del presupuesto"
                    readOnly
                    value={detalle?.notas || ''}
                    placeholder="Observaciones del presupuesto..."
                    className="mt-1.5 block h-20 w-full resize-none rounded-md border border-slate-300 bg-white p-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400"
                  />
                </label>
              </div>

              {loading && (
                <p className="text-center text-sm text-slate-500">Cargando ítems…</p>
              )}

              {!loading && detalle && (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="overflow-x-auto rounded-md border border-slate-300">
                    <table className="w-full min-w-[900px] table-fixed text-left text-xs">
                      <colgroup>
                        <col className="w-[20%]" />
                        <col className="w-[43%]" />
                        <col className="w-[12%]" />
                        <col className="w-[10%]" />
                        <col className="w-[15%]" />
                      </colgroup>
                      <thead className="sticky top-0 bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="border-r border-slate-300 px-3 py-3">Código</th>
                          <th className="border-r border-slate-300 px-3 py-3">Descripción</th>
                          <th className="whitespace-nowrap border-r border-slate-300 px-3 py-3 text-center">
                            Presentación
                          </th>
                          <th className="whitespace-nowrap border-r border-slate-300 px-3 py-3 text-center">
                            Cantidad
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-right">Precio unitario</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {rawItems.map((item, idx) => (
                          <tr key={`${item.codigo}-${idx}`} className="align-middle">
                            <td className="border-r border-slate-200 px-3 py-3 font-mono">
                              <strong className="block text-slate-900">{item.codigo}</strong>
                              {item.nropar && (
                                <span className="block text-slate-400">({item.nropar})</span>
                              )}
                            </td>
                            <td className="border-r border-slate-200 px-3 py-3 font-semibold text-slate-700">
                              {item.descripcion}
                            </td>
                            <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3 text-center">
                              {item.presentacion || 'Uni 1 Uni'}
                            </td>
                            <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3 text-center tabular-nums">
                              {Math.round(Number(item.cantidad ?? 0))}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">
                              {formatPedidoArs(item.precioUnitario)}
                            </td>
                          </tr>
                        ))}
                        {rawItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                              Este presupuesto no tiene ítems para mostrar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  </div>

                  <div className="shrink-0 space-y-3">
                  <div className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-right text-xs">
                    <span className="mr-1 font-semibold">Importe total:</span>
                    <strong className="text-sm">{formatPedidoArs(presupuestoTotal)}</strong>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      El importe total a facturar puede estar sujeto a percepciones u otros impuestos.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-700">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>Los precios están expresados en pesos y con I.V.A. incluido.</span>
                  </div>
                  </div>
                </>
              )}
            </section>
          )}

          {showComprobantes && (
            <section className="flex min-h-0 flex-1 flex-col gap-4">
              {comprobantesLoading && (
                <p className="text-sm text-slate-500">Cargando comprobantes…</p>
              )}
              {!comprobantesLoading && comprobantes.length === 0 && (
                <p className="text-sm text-slate-500">
                  No se encontraron comprobantes de facturación.
                </p>
              )}
              {!comprobantesLoading && invoice && (
                <>
                  <div className="shrink-0 space-y-4">
                  <div
                    className="flex gap-1 overflow-x-auto border-b border-slate-300 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="tablist"
                    aria-label="Comprobantes del pedido"
                  >
                    {comprobantes.map((item, index) => (
                      <button
                        key={`${item.modfor}-${item.codfor}-${item.nrofor}`}
                        type="button"
                        role="tab"
                        aria-selected={activeComprobante === index}
                        onClick={() => setActiveComprobante(index)}
                        className={`-mb-px shrink-0 rounded-t-xl border px-5 py-3 text-xs font-bold transition sm:text-sm ${
                          activeComprobante === index
                            ? 'border-slate-300 border-b-white bg-white text-slate-900'
                            : 'border-transparent bg-slate-100 text-slate-500 hover:border-slate-200 hover:text-[#1a79ff]'
                        }`}
                      >
                        Comprobante - {item.tipoLabel || `Factura ${item.codfor}`}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-5 px-1 text-xs lg:grid-cols-[1fr_1fr]">
                    <dl className="grid grid-cols-[110px_1fr] content-start gap-x-3 gap-y-2">
                      <dt className="font-bold text-slate-500">Comprobante:</dt>
                      <dd className="font-mono font-bold" style={{ color: PEDIDO_BRAND_DARK }}>
                        {invoice.numero}
                      </dd>
                      <dt className="font-bold text-slate-500">Nro. pedido:</dt>
                      <dd className="font-bold" style={{ color: PEDIDO_BRAND_DARK }}>
                        {invoice.nroPedido || detalle?.idVisible || '—'}
                      </dd>
                      <dt className="font-bold text-slate-500">Fecha:</dt>
                      <dd className="font-medium text-slate-700">
                        {formatPedidoFechaCorta(invoice.fecha)}
                      </dd>
                      <dt className="font-bold text-slate-500">Cliente:</dt>
                      <dd className="font-bold text-slate-700">{invoice.cliente || '—'}</dd>
                      <dt className="font-bold text-slate-500">Dirección:</dt>
                      <dd className="font-medium text-slate-700">{invoice.direccion || '—'}</dd>
                    </dl>
                    <label className="font-bold text-slate-500">
                      Notas:
                      <textarea
                        aria-label="Notas del comprobante"
                        readOnly
                        value={invoice.notas || ''}
                        placeholder="Observaciones de la factura..."
                        className="mt-1.5 block h-20 w-full resize-none rounded-md border border-slate-300 bg-white p-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400"
                      />
                    </label>
                  </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="overflow-x-auto rounded-md border border-slate-300">
                    <table className="w-full min-w-[900px] table-fixed text-left text-xs">
                      <colgroup>
                        <col className="w-[15%]" />
                        <col className="w-[42%]" />
                        <col className="w-[11%]" />
                        <col className="w-[8%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead className="sticky top-0 bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="border-r border-slate-300 px-3 py-3">Código</th>
                          <th className="border-r border-slate-300 px-3 py-3">Descripción</th>
                          <th className="whitespace-nowrap border-r border-slate-300 px-3 py-3 text-center">
                            Presentación
                          </th>
                          <th className="whitespace-nowrap border-r border-slate-300 px-3 py-3 text-center">
                            Cantidad
                          </th>
                          <th className="whitespace-nowrap border-r border-slate-300 px-3 py-3 text-right">
                            Precio unitario
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(invoice.items ?? []).map((item, idx) => (
                          <tr
                            key={`${item.codigo}-${idx}`}
                            className="align-middle"
                          >
                            <td className="border-r border-slate-200 px-3 py-3 font-mono">
                              <strong className="block">
                                {item.delPedido && (
                                  <span className="mr-1" style={{ color: PEDIDO_BRAND }}>
                                    *
                                  </span>
                                )}
                                {item.codigo}
                              </strong>
                              {item.nropar && (
                                <span className="block text-slate-400">({item.nropar})</span>
                              )}
                            </td>
                            <td className="border-r border-slate-200 px-3 py-3 font-semibold text-slate-700">
                              {item.descripcion}
                            </td>
                            <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3 text-center">
                              {item.presentacion || 'Uni 1 Uni'}
                            </td>
                            <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3 text-center">
                              {Math.round(Number(item.cantidad ?? 0))}
                            </td>
                            <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3 text-right">
                              {formatPedidoArs(item.precioUnitario)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-bold">
                              {formatPedidoArs(item.total)}
                            </td>
                          </tr>
                        ))}
                        {(invoice.items ?? []).length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-3 py-8 text-center text-sm text-slate-500"
                            >
                              Este comprobante no tiene ítems para mostrar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  </div>

                  <div className="shrink-0 space-y-3">
                  <div className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-right text-xs">
                    <span className="mr-1 font-semibold">Sub-total:</span>
                    <strong className="text-sm">{formatPedidoArs(invoice.subtotal)}</strong>
                  </div>

                  <div className="grid gap-4 text-xs md:grid-cols-3">
                    {(() => {
                      const percRows =
                        (invoice.percepciones?.length ?? 0) > 0
                          ? invoice.percepciones!
                          : Number(invoice.percepcion ?? 0) > 0
                            ? [{ descripcion: 'Percepciones', importe: Number(invoice.percepcion) }]
                            : []
                      if (percRows.length === 0) return null
                      return (
                        <div className="rounded-md border border-slate-300 p-2">
                          <h4 className="px-1 pb-2 font-bold text-slate-700">Percepciones</h4>
                          <div className="space-y-1">
                            {percRows.map((row, idx) => (
                              <div
                                key={`perc-${idx}-${row.descripcion}`}
                                className="flex min-h-10 items-center justify-between gap-2 rounded bg-slate-50 px-3 py-2"
                              >
                                <span className="min-w-0 break-words">{row.descripcion}</span>
                                <strong className="shrink-0">{formatPedidoArs(row.importe)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                    {(() => {
                      const impRows =
                        (invoice.impuestos?.length ?? 0) > 0
                          ? invoice.impuestos!
                          : Number(invoice.iva ?? 0) > 0
                            ? [{ descripcion: 'Impuestos', importe: Number(invoice.iva) }]
                            : []
                      if (impRows.length === 0) return null
                      return (
                        <div className="rounded-md border border-slate-300 p-2">
                          <h4 className="px-1 pb-2 font-bold text-slate-700">Impuestos</h4>
                          <div className="space-y-1">
                            {impRows.map((row, idx) => (
                              <div
                                key={`imp-${idx}-${row.descripcion}`}
                                className="flex min-h-10 items-center justify-between gap-2 rounded bg-slate-50 px-3 py-2"
                              >
                                <span className="min-w-0 break-words">{row.descripcion}</span>
                                <strong className="shrink-0">{formatPedidoArs(row.importe)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                    <div className="rounded-md border border-slate-300 p-2 md:col-start-3">
                      <h4 className="px-1 pb-2 font-bold text-slate-700">Totales</h4>
                      <div className="space-y-1">
                        {(invoice.totales?.length ?? 0) > 0
                          ? invoice.totales!.map((row, idx) => (
                              <div
                                key={`tot-${idx}-${row.descripcion}`}
                                className="flex min-h-10 items-center justify-between gap-2 rounded bg-slate-50 px-3 py-2 text-sm"
                              >
                                <strong className="min-w-0 break-words">{row.descripcion}</strong>
                                <strong
                                  className="shrink-0 text-base"
                                  style={{ color: PEDIDO_BRAND_DARK }}
                                >
                                  {formatPedidoArs(row.importe)}
                                </strong>
                              </div>
                            ))
                          : (
                              <div className="flex min-h-12 items-center justify-between rounded bg-slate-50 px-3 py-2 text-sm">
                                <strong>Totales</strong>
                                <strong className="text-base" style={{ color: PEDIDO_BRAND_DARK }}>
                                  {formatPedidoArs(invoice.total)}
                                </strong>
                              </div>
                            )}
                      </div>
                    </div>
                  </div>

                  {(invoice.items ?? []).some((i) => i.delPedido) && (
                    <p className="text-xs font-medium text-slate-600">
                      <span className="mr-1 font-black" style={{ color: PEDIDO_BRAND }}>
                        *
                      </span>
                      Ítem correspondiente al pedido seleccionado.
                    </p>
                  )}
                  <p className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-700">
                    <Info className="h-4 w-4 shrink-0" />
                    Los datos informados son de carácter orientativo.
                  </p>
                  </div>
                </>
              )}
            </section>
          )}

          {showRepartos && (
            <section className="flex min-h-0 flex-1 flex-col">
              <h3 className="shrink-0 text-sm font-bold text-slate-800">Datos de reparto</h3>
              {repartosLoading && (
                <p className="mt-3 text-sm text-slate-500">Cargando repartos…</p>
              )}
              {!repartosLoading && repartos.length === 0 && (
                <p className="mt-3 text-sm text-slate-500">No hay datos de reparto para mostrar.</p>
              )}
              {!repartosLoading && repartos.length > 0 && (
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[900px] table-fixed text-left text-xs">
                    <colgroup>
                      <col className="w-[10%]" />
                      <col className="w-[13%]" />
                      <col className="w-[15%]" />
                      <col className="w-[12%]" />
                      <col className="w-[22%]" />
                      <col className="w-[22%]" />
                      <col className="w-[6%]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                      <tr>
                        {[
                          'Nro. reparto',
                          'Fecha',
                          'Remito',
                          'Sucursal',
                          'Dirección de entrega',
                          'Transporte',
                          'Bultos',
                        ].map((label) => (
                          <th
                            key={label}
                            className="border-r border-slate-200 px-3 py-3 last:border-r-0"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {repartos.map((r, idx) => (
                        <tr
                          key={`${r.nroReparto}-${r.codRemito}-${r.nroRemito}-${idx}`}
                          className="align-middle"
                        >
                          <td className="border-r border-slate-200 px-3 py-4 text-center font-bold">
                            {r.nroReparto ?? '—'}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-4 text-center">
                            {formatPedidoFechaCorta(r.fechaReparto)}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-4 text-center font-mono">
                            {r.codRemito && r.nroRemito != null
                              ? `${r.codRemito}-${r.nroRemito}`
                              : '—'}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-4">
                            {r.sucursal || '—'}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-4 font-semibold">
                            {r.direccionEntrega || '—'}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-4 font-semibold">
                            {r.transporte || '—'}
                          </td>
                          <td className="px-3 py-4 text-center font-bold">
                            {r.cantidadBultos ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              )}
              <p className="mt-3 flex shrink-0 items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-sky-800">
                <Info className="h-4 w-4 shrink-0" />
                Los datos informados son de carácter orientativo.
              </p>
            </section>
          )}

          {!showComprobantes && !showRepartos && !showPresupuesto && (
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Ítems del pedido</h3>
                  {showDepositoUi && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Cant. = no entregado (pasado − procesado)
                      {!hayPendientes ? ' · Sin unidades no entregadas' : ''}
                    </p>
                  )}
                </div>
                {showDepositoUi && depositoFilter && (
                  <button
                    type="button"
                    onClick={() => setDepositoFilter('')}
                    className="text-xs font-bold"
                    style={{ color: PEDIDO_BRAND }}
                  >
                    Ver todos los ítems
                  </button>
                )}
              </div>

              {showDepositoUi && options.length > 0 && (
                <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Depósito:</span>
                  <button
                    type="button"
                    onClick={() => setDepositoFilter('')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      !depositoFilter
                        ? 'text-white'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                    }`}
                    style={!depositoFilter ? { backgroundColor: PEDIDO_BRAND } : undefined}
                  >
                    Todos
                  </button>
                  {options.map((o) => (
                    <button
                      key={o.code}
                      type="button"
                      onClick={() => setDepositoFilter(o.code)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        depositoFilter === o.code
                          ? 'text-white'
                          : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                      }`}
                      style={
                        depositoFilter === o.code ? { backgroundColor: PEDIDO_BRAND } : undefined
                      }
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <p className="mt-8 text-center text-sm text-slate-500">Cargando ítems…</p>
              )}

              {!loading && detalle && (
                <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[900px] table-fixed text-left text-xs">
                    <colgroup>
                      <col className="w-[16%]" />
                      <col className="w-[39%]" />
                      <col className="w-[10%]" />
                      <col className="w-[17.5%]" />
                      <col className="w-[17.5%]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-slate-100 font-bold text-slate-600">
                      <tr>
                        <th className="px-3 py-3">Código</th>
                        <th className="px-3 py-3">Descripción</th>
                        <th className="whitespace-nowrap px-3 py-3 text-center">Cantidad</th>
                        <th className="whitespace-nowrap px-3 py-3 text-right">Precio unitario</th>
                        <th className="whitespace-nowrap px-3 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const cant = Number(item.cantidad ?? item.cantidadPendiente ?? 0);
                        return (
                          <tr
                            key={`${item.codigo}-${item.deposito ?? ''}-${idx}`}
                            className="align-middle"
                          >
                            <td className="px-3 py-3 font-mono font-semibold text-slate-800">
                              {item.codigo}
                              {showDepositoUi &&
                                options.length > 1 &&
                                (item.depositoNombre || item.deposito) && (
                                <span className="mt-0.5 block text-[10px] font-sans font-normal text-slate-500">
                                  Dep: {item.depositoNombre || item.deposito}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 font-semibold text-slate-700">
                              {item.descripcion}
                            </td>
                            <td
                              className={`whitespace-nowrap px-3 py-3 text-center tabular-nums ${
                                cant > 0 ? 'font-bold text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {Math.round(cant)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                              {formatPedidoArs(item.precioUnitario)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums">
                              {formatPedidoArs(item.subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                            Este presupuesto no tiene ítems para mostrar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {items.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                          <td
                            colSpan={4}
                            className="px-3 py-3 text-right text-xs font-bold text-slate-600"
                          >
                            Total
                          </td>
                          <td
                            className="whitespace-nowrap px-3 py-3 text-right text-sm font-black tabular-nums"
                            style={{ color: PEDIDO_BRAND_DARK }}
                          >
                            {formatPedidoArs(total)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

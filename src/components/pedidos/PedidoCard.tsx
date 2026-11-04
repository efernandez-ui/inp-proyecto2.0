import { Boxes, CalendarDays, ChevronRight } from 'lucide-react';
import type { PedidoEtapa, PedidoListItem } from '@/services/pedidos';
import { formatPedidoFecha } from '@/services/pedidos';
import {
  currentStepIndex,
  PEDIDO_BRAND,
  PEDIDO_BRAND_DARK,
  PEDIDO_STEPS,
  type PedidoInstanciaStep,
} from './pedidoSteps';

function statusBadgeClass(etapa: PedidoEtapa): string {
  if (etapa === 'CANCELADO') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (etapa === 'RECIBIDO') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (etapa === 'ANALISIS') return 'border-indigo-200 bg-indigo-50 text-indigo-700';
  if (etapa === 'PREPARACION') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (etapa === 'FACTURADO') return 'border-cyan-200 bg-cyan-50 text-cyan-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function StatusBadge({ etapa, label }: { etapa: PedidoEtapa; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusBadgeClass(etapa)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || etapa}
    </span>
  );
}

export default function PedidoCard({
  pedido,
  onOpen,
  onOpenPendientes,
}: {
  pedido: PedidoListItem;
  onOpen: (step?: PedidoInstanciaStep) => void;
  onOpenPendientes?: () => void;
}) {
  const done = pedido.etapasCompletas ?? [];
  const currentIdx = currentStepIndex(pedido.etapa);
  const pendientes = Number(pedido.unidadesPendientes ?? 0);
  const mostrarBadgeP = pendientes > 0 || !!pedido.mostrarPendientes;
  const progressPct =
    currentIdx < 0 ? 0 : Math.min(100, (currentIdx / Math.max(1, PEDIDO_STEPS.length - 1)) * 100);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="order-card w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left text-slate-900 shadow-sm transition hover:shadow-md sm:p-5"
    >
      <div className="grid items-center gap-5 xl:grid-cols-[330px_minmax(0,1fr)_150px]">
        <div className="flex flex-wrap items-center gap-2.5 xl:border-r xl:border-slate-100 xl:pr-5">
          <span
            className="rounded-lg px-3 py-1.5 text-xs font-black tracking-wide text-white"
            style={{ backgroundColor: PEDIDO_BRAND_DARK }}
          >
            {pedido.idVisible}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" style={{ color: PEDIDO_BRAND }} />
            {formatPedidoFecha(pedido.fecha)}
          </span>
          <StatusBadge etapa={pedido.etapa} label={pedido.etapaLabel} />
        </div>

        {/* Padding extra: el paso activo flota/ring; overflow-x no debe recortar el efecto. */}
        <div className="min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative flex min-w-[650px] justify-between px-5 pb-3 pt-4">
            <div className="pointer-events-none absolute left-10 right-10 top-[1.625rem] h-1 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full"
                style={{ width: `${progressPct}%`, backgroundColor: PEDIDO_BRAND }}
              />
            </div>
            {PEDIDO_STEPS.map((step, i) => {
              const complete = !!done[i];
              const current = i === currentIdx;
              const reached = complete || current || (currentIdx >= 0 && i < currentIdx);
              const Icon = step.icon;
              return (
                <button
                  key={step.key}
                  type="button"
                  title={reached ? `Ver detalle: ${step.label}` : 'Etapa pendiente'}
                  disabled={!reached}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reached) onOpen(step.key);
                  }}
                  className={`relative z-10 flex w-24 flex-col items-center gap-1 text-center ${
                    reached ? 'cursor-pointer' : 'cursor-not-allowed opacity-45'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      current
                        ? 'active-order-step border-[#1a79ff] bg-white text-[#1a79ff] ring-4 ring-blue-100'
                        : reached
                          ? 'border-[#1a79ff] bg-[#1a79ff] text-white'
                          : 'border-slate-200 bg-white text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={`text-[10px] leading-tight ${
                      current
                        ? 'font-black text-[#1a79ff]'
                        : reached
                          ? 'font-bold text-slate-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {mostrarBadgeP ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPendientes?.();
            }}
            className={`inline-flex min-h-11 w-full max-w-[150px] items-center justify-center gap-2 justify-self-start rounded-lg px-3 py-1.5 text-[11px] font-bold xl:justify-self-end ${
              pendientes > 0
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-500'
            }`}
            title="Ver no entregados por pedido"
          >
            <Boxes className="h-4 w-4 shrink-0" />
            {pendientes > 0 ? (
              <span className="flex flex-col items-center leading-tight">
                <strong className="text-sm font-black">{Math.round(pendientes)}</strong>
                <span>no entregados</span>
              </span>
            ) : (
              <span>Sin pendientes</span>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </button>
        ) : (
          <div className="hidden xl:block" />
        )}
      </div>
    </article>
  );
}

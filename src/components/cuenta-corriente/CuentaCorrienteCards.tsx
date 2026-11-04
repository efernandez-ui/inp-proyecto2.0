'use client';

import { Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import type { CuentaCorrienteResumen } from '@/services/cuentaCorriente';
import { formatCurrency, formatDate } from '@/services/cuentaCorriente';

interface Props {
  resumen: CuentaCorrienteResumen;
}

function LimiteCreditoCard({ resumen }: { resumen: CuentaCorrienteResumen }) {
  const limite = resumen.limiteDeCredito ?? 0;
  const consumido = resumen.saldoConsumido ?? 0;
  const disponible = resumen.disponible ?? 0;
  const pct = Math.min(100, Math.max(0, resumen.porcentajeConsumo ?? 0));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
        Límite de crédito
      </p>
      <p className="mt-2 text-2xl font-black text-[#001f3f]">
        {formatCurrency(limite)}
      </p>
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-gray-500">
          <span>Consumo: {pct.toFixed(0)}%</span>
          <span>·</span>
          <span>Disp: {formatCurrency(disponible)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#2dd4a3] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="mt-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
        Consumido: {formatCurrency(consumido)}
      </p>
    </div>
  );
}

export default function CuentaCorrienteCards({ resumen }: Props) {
  const cards = [
    {
      key: 'a-vencer',
      label: 'Saldo a vencer',
      value: resumen.saldoAVencer,
      color: 'text-[#0e8c85]',
      border: 'border-[#0e8c85]/20',
      icon: Clock,
      footer: resumen.proximoVencimiento
        ? `Próximo: ${formatDate(resumen.proximoVencimiento)}`
        : 'Sin vencimientos próximos',
    },
    {
      key: 'vencido',
      label: 'Saldo vencido',
      value: resumen.saldoVencido,
      color: 'text-red-600',
      border: 'border-red-200 border-b-2 border-b-red-400',
      icon: AlertTriangle,
      footer: resumen.saldoVencido > 0 ? '' : 'Al día',
      footerAlert: resumen.saldoVencido > 0,
    },
    {
      key: 'pendiente',
      label: 'Saldo pendiente de aplicar',
      value: resumen.saldoPendienteAplicar,
      color: 'text-emerald-600',
      border: 'border-emerald-200 border-b-2 border-b-emerald-400',
      icon: RotateCcw,
      footer: '',
    },
  ];

  const gridCols = resumen.canVerLimiteCredito
    ? 'md:grid-cols-4'
    : 'md:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
      {resumen.canVerLimiteCredito && <LimiteCreditoCard resumen={resumen} />}
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`rounded-2xl border bg-white p-5 shadow-sm ${card.border}`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              {card.label}
            </p>
            <p className={`mt-2 text-2xl font-black ${card.color}`}>
              {formatCurrency(card.value)}
            </p>
            <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${card.footerAlert ? 'text-red-600' : 'text-gray-500'}`}>
              <Icon className="h-3.5 w-3.5" />
              {card.footer}
            </div>
          </div>
        );
      })}
    </div>
  );
}

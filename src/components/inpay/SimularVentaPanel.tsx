'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  INPAY_TERMINALS,
  filterCoeficientesByTerminal,
  type InpayTerminal,
} from '@/config/inpayTerminals';
import {
  formatCurrency,
  formatMultiplo,
  planKey,
  resolveMultiploTotal,
  resolveMultiploTotalConIva,
  simularVenta,
  type TarjetaCoeficiente,
} from '@/services/tarjetasCoeficientes';
import PlanCoeficientePicker from './PlanCoeficientePicker';
import SolicitarTerminalSection from './SolicitarTerminalSection';

interface Props {
  coeficientes: TarjetaCoeficiente[];
  terminalId: string;
  onTerminalChange: (id: string) => void;
  montoNeto: string;
  onMontoNetoChange: (value: string) => void;
  selectedPlanKey: string;
  onPlanChange: (key: string) => void;
}

const emptySimulacion = {
  montoNeto: 0,
  meTomoIva: false,
  comision: 0,
  costoFinanciero: 0,
  totalGastos: 0,
  ivaCreditoFiscal: 0,
  multiploAplicado: 0,
  importeFinal: 0,
  cantidadCuotas: 1,
  importePorCuota: 0,
};

export default function SimularVentaPanel({
  coeficientes,
  terminalId,
  onTerminalChange,
  montoNeto,
  onMontoNetoChange,
  selectedPlanKey,
  onPlanChange,
}: Props) {
  const [meTomoIva, setMeTomoIva] = useState(false);

  const terminalPlans = filterCoeficientesByTerminal(coeficientes, terminalId);
  const selectedPlan =
    terminalPlans.find((p) => planKey(p) === selectedPlanKey) ?? terminalPlans[0] ?? null;

  const monto = parseFloat(montoNeto.replace(',', '.')) || 0;
  const simulacion = selectedPlan
    ? simularVenta(monto, selectedPlan, { meTomoIva })
    : emptySimulacion;
  const multiploTotal = selectedPlan ? resolveMultiploTotal(selectedPlan) : 0;
  const multiploConIva = selectedPlan ? resolveMultiploTotalConIva(selectedPlan) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-wide text-[#001f3f]">Simular venta</h2>
      <p className="mt-1 text-xs text-gray-500">Seleccioná terminal y plan para calcular el importe a cobrar.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {INPAY_TERMINALS.map((terminal) => (
          <TerminalCard
            key={terminal.id}
            terminal={terminal}
            active={terminalId === terminal.id}
            onClick={() => onTerminalChange(terminal.id)}
          />
        ))}
      </div>

      <label className="mt-5 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
        Monto neto deseado
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={montoNeto}
            onChange={(e) => onMontoNetoChange(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-xl border border-gray-200 py-3 pl-8 pr-3 text-lg font-bold text-[#001f3f] outline-none focus:border-[#0e8c85] focus:ring-2 focus:ring-[#0e8c85]/20"
          />
        </div>
      </label>

      <div className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
        Plan de cuotas
        <PlanCoeficientePicker
          plans={terminalPlans}
          value={selectedPlan ? planKey(selectedPlan) : ''}
          onChange={onPlanChange}
          disabled={terminalPlans.length === 0}
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#001f3f]">
        <input
          type="checkbox"
          checked={meTomoIva}
          onChange={(e) => setMeTomoIva(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#0e8c85] focus:ring-[#0e8c85]/30"
        />
        Recupero IVA crédito fiscal
      </label>

      <div className="mt-5 rounded-2xl border-l-4 border-[#fc7703] bg-orange-50/60 p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#fc7703]">
          Importe final a cobrar (con IVA)
        </p>
        <p className="mt-1 text-3xl font-black text-[#001f3f]">
          {formatCurrency(simulacion.importeFinal)}
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Monto Neto Pretendido</dt>
            <dd className="font-semibold text-gray-800">{formatCurrency(simulacion.montoNeto)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Comisión</dt>
            <dd className="font-semibold text-[#fc7703]">{formatCurrency(simulacion.comision)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Costo financiero</dt>
            <dd className="font-semibold text-[#fc7703]">{formatCurrency(simulacion.costoFinanciero)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Total Gastos</dt>
            <dd className="font-bold text-[#fc7703]">{formatCurrency(simulacion.totalGastos)}</dd>
          </div>
          {simulacion.meTomoIva && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">IVA Crédito Fiscal</dt>
              <dd className="font-semibold text-[#0e8c85]">{formatCurrency(simulacion.ivaCreditoFiscal)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 border-t border-dashed border-gray-300 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            EN {simulacion.cantidadCuotas} CUOTAS DE
          </p>
          <p className="mt-1 text-2xl font-black text-[#fc7703]">
            {formatCurrency(simulacion.importePorCuota)}
          </p>
        </div>

        <div className="mt-4 border-t border-dashed border-gray-300 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Múltiplo total</dt>
              <dd
                className={`mt-0.5 font-semibold tabular-nums ${
                  meTomoIva ? 'text-[#0e8c85]' : 'text-gray-800'
                }`}
              >
                {selectedPlan ? formatMultiplo(multiploTotal) : formatMultiplo(0)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Múltiplo c/IVA</dt>
              <dd
                className={`mt-0.5 font-semibold tabular-nums ${
                  !meTomoIva ? 'text-[#0e8c85]' : 'text-gray-800'
                }`}
              >
                {selectedPlan ? formatMultiplo(multiploConIva) : formatMultiplo(0)}
              </dd>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-gray-600">
              Múltiplo aplicado {meTomoIva ? '(s/IVA)' : '(c/IVA)'}
            </dt>
            <dd>
              <span className="rounded-md bg-[#0e8c85]/10 px-2 py-1 font-semibold tabular-nums text-[#0e8c85]">
                {selectedPlan ? formatMultiplo(simulacion.multiploAplicado) : formatMultiplo(0)}
              </span>
            </dd>
          </div>
        </div>
      </div>

      <p className="mt-5 text-[10px] leading-relaxed text-gray-500">
        El valor final incluye costo financiero, comisión de plataforma e IVA aplicable.
      </p>

      <SolicitarTerminalSection />
    </div>
  );
}

function TerminalCard({
  terminal,
  active,
  onClick,
}: {
  terminal: InpayTerminal;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition ${
        active
          ? 'border-[#fc7703] bg-orange-50/50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <Image
        src={terminal.logo}
        alt={terminal.label}
        width={220}
        height={56}
        className="h-12 w-full max-w-[220px] object-contain object-left"
      />
      <span className="text-[10px] font-bold uppercase leading-tight text-[#001f3f]">
        {terminal.label}
      </span>
    </button>
  );
}

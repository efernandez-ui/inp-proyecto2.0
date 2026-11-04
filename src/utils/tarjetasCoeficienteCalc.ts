export type TarjetaPlanCalculo = {
  comision?: number;
  coeficienteFinanciero?: number;
  multiploTotal?: number;
  multiploTotalConIva?: number;
  cuotas?: string;
  codigoPlan?: string;
  plan?: string;
};

export interface SimularVentaOptions {
  meTomoIva?: boolean;
}

export interface SimulacionVenta {
  montoNeto: number;
  meTomoIva: boolean;
  comision: number;
  costoFinanciero: number;
  totalGastos: number;
  ivaCreditoFiscal: number;
  multiploAplicado: number;
  importeFinal: number;
  cantidadCuotas: number;
  importePorCuota: number;
}

const IVA = 1.21;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** F6: L6/(1-L6)+1 con L6 = (E6-1)/E6 + D6/100 */
function rawMultiploTotal(coeficiente: number, comisionPct: number): number {
  const tasa = (coeficiente - 1) / coeficiente + comisionPct / 100;
  return tasa / (1 - tasa) + 1;
}

/** G6: convierte F6 a múltiplo con IVA en la tasa */
function rawMultiploTotalConIva(multiploTotal: number): number {
  const tasaConIva = ((multiploTotal - 1) / multiploTotal) * IVA;
  return tasaConIva / (1 - tasaConIva) + 1;
}

/** Múltiplo total (s/IVA), mismo valor que la tabla de coeficientes. */
export function resolveMultiploTotal(plan: TarjetaPlanCalculo): number {
  if (plan.multiploTotal != null && Number.isFinite(plan.multiploTotal)) {
    return round4(plan.multiploTotal);
  }
  const coef = plan.coeficienteFinanciero ?? 1;
  const comision = plan.comision ?? 0;
  return round4(rawMultiploTotal(coef, comision));
}

/** Múltiplo con IVA, mismo valor que la tabla de coeficientes. */
export function resolveMultiploTotalConIva(plan: TarjetaPlanCalculo): number {
  if (plan.multiploTotalConIva != null && Number.isFinite(plan.multiploTotalConIva)) {
    return round4(plan.multiploTotalConIva);
  }
  return round4(rawMultiploTotalConIva(resolveMultiploTotal(plan)));
}

/** Cantidad de cuotas desde BD, código de plan o descripción del plan. */
export function parseCantidadCuotas(plan: TarjetaPlanCalculo): number {
  const fromField = parsePositiveInt(plan.cuotas);
  if (fromField > 0) return fromField;

  const fromCodigo = parsePositiveInt(plan.codigoPlan);
  if (fromCodigo > 0) return fromCodigo;

  const desc = (plan.plan ?? '').trim();
  if (!desc) return 1;

  const cuotasMatch = desc.match(/\b(\d{1,2})\s*cuotas?\b/i);
  if (cuotasMatch) {
    const n = parseInt(cuotasMatch[1], 10);
    if (n > 0) return n;
  }

  const parenthesisMatch = desc.match(/\((\d{1,2})\)/);
  if (parenthesisMatch) {
    const n = parseInt(parenthesisMatch[1], 10);
    if (n > 0) return n;
  }

  return 1;
}

function parsePositiveInt(raw?: string): number {
  if (!raw?.trim()) return 0;
  const n = parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Simulación según planilla Excel (ramas C10–C13 / C16–C20). */
export function simularVenta(
  montoNeto: number,
  plan: TarjetaPlanCalculo,
  options?: SimularVentaOptions,
): SimulacionVenta {
  const neto = Number.isFinite(montoNeto) ? montoNeto : 0;
  const meTomoIva = options?.meTomoIva ?? false;
  const coef = plan.coeficienteFinanciero ?? 1;
  const comisionPct = (plan.comision ?? 0) / 100;
  const tasaFin = coef > 0 ? (coef - 1) / coef : 0;

  const multiploAplicado = meTomoIva
    ? resolveMultiploTotal(plan)
    : resolveMultiploTotalConIva(plan);
  const importeFinal = round2(neto * multiploAplicado);

  let comision: number;
  let costoFinanciero: number;

  if (meTomoIva) {
    comision = round2(importeFinal * comisionPct);
    costoFinanciero = round2(tasaFin * importeFinal);
  } else {
    comision = round2(importeFinal * comisionPct * IVA);
    costoFinanciero = round2(tasaFin * importeFinal * IVA);
  }

  const totalGastos = round2(comision + costoFinanciero);
  const ivaCreditoFiscal = meTomoIva ? round2(totalGastos * 0.21) : 0;
  const cantidadCuotas = parseCantidadCuotas(plan);
  const importePorCuota =
    cantidadCuotas > 0 ? round2(importeFinal / cantidadCuotas) : 0;

  return {
    montoNeto: round2(neto),
    meTomoIva,
    comision,
    costoFinanciero,
    totalGastos,
    ivaCreditoFiscal,
    multiploAplicado,
    importeFinal,
    cantidadCuotas,
    importePorCuota,
  };
}

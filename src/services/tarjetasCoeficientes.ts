import { readApiErrorMessage } from '@/utils/apiError';

const API_BASE = `${process.env.NEXT_PUBLIC_API_BACKEND}/api/tarjetas`;

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface TarjetaCoeficiente {
  nroItem: number;
  modcpt: string;
  tipcpt: string;
  codcpt: string;
  tarjeta: string;
  plan: string;
  comision: number;
  coeficienteFinanciero: number;
  multiploTotal: number;
  multiploTotalConIva: number;
  codigoPlan: string;
  cuotas?: string;
}

export interface TarjetasCoeficientesResponse {
  fechaUltimaModificacion?: string | null;
  coeficientes: TarjetaCoeficiente[];
}

export type { SimulacionVenta, SimularVentaOptions } from '@/utils/tarjetasCoeficienteCalc';
export {
  parseCantidadCuotas,
  resolveMultiploTotal,
  resolveMultiploTotalConIva,
  simularVenta,
} from '@/utils/tarjetasCoeficienteCalc';

export function planKey(plan: TarjetaCoeficiente): string {
  return `${plan.nroItem}|${plan.modcpt}|${plan.tipcpt}|${plan.codcpt}`;
}

export async function fetchCoeficientes(token: string): Promise<TarjetasCoeficientesResponse> {
  const res = await fetch(`${API_BASE}/coeficientes`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'Error al cargar coeficientes'));
  }
  return res.json();
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

export function formatMultiplo(value: number): string {
  return value.toFixed(4).replace('.', ',');
}

/** Múltiplo con 3 decimales (planilla Excel / simulador). */
export function formatMultiplo3(value: number): string {
  return value.toFixed(3).replace('.', ',');
}

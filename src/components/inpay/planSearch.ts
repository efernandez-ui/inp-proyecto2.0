import {
  formatMultiplo,
  formatPercent,
  type TarjetaCoeficiente,
} from '@/services/tarjetasCoeficientes';

export function matchesPlanSearch(row: TarjetaCoeficiente, q: string): boolean {
  const hay = [
    row.tarjeta,
    row.plan,
    row.codigoPlan,
    formatPercent(row.comision),
    formatMultiplo(row.coeficienteFinanciero),
    formatMultiplo(row.multiploTotal),
    formatMultiplo(row.multiploTotalConIva),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function planDisplayLabel(plan: TarjetaCoeficiente): string {
  return `${plan.tarjeta ?? ''} — ${plan.plan ?? ''}`.trim();
}

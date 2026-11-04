export function deriveTipfin(stock: boolean, countdown: boolean): string | null {
  if (stock && countdown) return 'B';
  if (countdown) return 'C';
  if (stock) return 'S';
  return null;
}

export function tipfinToChecks(tipfin?: string | null): {
  cierrePorStock: boolean;
  cuentaRegresiva: boolean;
} {
  const normalized = tipfin?.trim().toUpperCase();
  return {
    cierrePorStock: normalized === 'B' || normalized === 'S' || normalized === 'A',
    cuentaRegresiva: normalized === 'B' || normalized === 'C',
  };
}

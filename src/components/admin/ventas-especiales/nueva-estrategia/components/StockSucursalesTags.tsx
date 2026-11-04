type Props = {
  noa: number;
  nea: number;
  bue: number;
  cuy: number;
  className?: string;
};

const sucursales = [
  { label: 'NOA', key: 'noa' as const },
  { label: 'NEA', key: 'nea' as const },
  { label: 'BUE', key: 'bue' as const },
  { label: 'CUY', key: 'cuy' as const },
];

export function StockSucursalesTags({ noa, nea, bue, cuy, className = '' }: Props) {
  const values = { noa, nea, bue, cuy };

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {sucursales.map(({ label, key }) => {
        const value = values[key];
        const hasStock = value > 0;
        return (
          <span
            key={label}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
              hasStock
                ? 'border-[#0e8c85]/30 bg-[#0e8c85]/10 text-[#0b6f69]'
                : 'border-slate-200 bg-slate-100 text-slate-500'
            }`}
          >
            <span className="font-bold uppercase">{label}</span>
            <span className="tabular-nums">{value.toLocaleString('es-AR')}</span>
          </span>
        );
      })}
    </div>
  );
}

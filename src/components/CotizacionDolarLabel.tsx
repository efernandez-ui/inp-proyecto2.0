'use client';

import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { formatCotizacionDolarValor } from '../services/moneda';

type Variant = 'nav' | 'drawer' | 'compact';

type Props = {
  variant?: Variant;
};

const labelClass =
  'text-[10px] md:text-[11px] font-medium uppercase tracking-wide whitespace-nowrap shrink-0 text-gray-400';

export default function CotizacionDolarLabel({ variant = 'nav' }: Props) {
  const { cotizacionDolar, isLoggedIn } = useSelector((state: RootState) => state.auth);

  if (!isLoggedIn || !cotizacionDolar?.valor) {
    return null;
  }

  const valor = formatCotizacionDolarValor(cotizacionDolar.valor);

  if (variant === 'drawer') {
    return (
      <div className={`mt-4 ${labelClass}`} title="Cotización del dólar">
        COTIZACIÓN USD{' '}
        <span className="font-bold text-white tabular-nums">$ {valor}</span>
      </div>
    );
  }

  return (
    <div className={labelClass} title="Cotización del dólar">
      COTIZACIÓN USD{' '}
      <span className="font-bold text-white tabular-nums">$ {valor}</span>
    </div>
  );
}

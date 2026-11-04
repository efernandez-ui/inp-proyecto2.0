import type { LucideIcon } from 'lucide-react';
import type { TipoOfertaPool } from '@/services/admin';
import { NUEVA_ESTRATEGIA_MINT, NUEVA_ESTRATEGIA_NAVY } from '../constants';

type Props = {
  tipo: TipoOfertaPool;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
};

export function TipoOfertaPoolSelectCard({ tipo, icon: Icon, selected, onSelect }: Props) {
  const titulo = (tipo.descripcion && tipo.descripcion.trim()) || tipo.codigo;
  const detalle =
    (tipo.descripcionDetalle && tipo.descripcionDetalle.trim()) || `Código POOLTH: ${tipo.codigo}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'flex gap-4 rounded-[18px] border-2 bg-white p-4 text-left shadow-sm transition',
        selected ? 'shadow-[0_10px_30px_rgba(45,212,163,0.22)]' : 'border-gray-100 hover:border-gray-200',
      ].join(' ')}
      style={selected ? { borderColor: NUEVA_ESTRATEGIA_MINT } : undefined}
    >
      <span
        className={[
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
          selected ? '' : 'bg-gray-100 text-gray-500',
        ].join(' ')}
        style={selected ? { backgroundColor: NUEVA_ESTRATEGIA_MINT, color: NUEVA_ESTRATEGIA_NAVY } : undefined}
      >
        <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">{tipo.codigo}</span>
        <span className="mt-0.5 block text-[12px] font-black uppercase leading-tight tracking-tight text-[#001f3f]">
          {titulo}
        </span>
        <span className="mt-1.5 block text-[11px] font-semibold leading-snug text-gray-500">{detalle}</span>
      </span>
    </button>
  );
}

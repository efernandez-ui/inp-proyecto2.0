'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Globe2, MapPin, Users } from 'lucide-react';
import {
  getCondicionesPago,
  type CondicionPagoOption,
  type VentaEspecialEdicionDetalle,
} from '@/services/admin';

type Props = {
  segmentacion: VentaEspecialEdicionDetalle['segmentacion'];
  condicionesPago: string[];
};

const panelClass = 'rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4';
const titleClass = 'text-[11px] font-black uppercase tracking-[0.16em] text-slate-500';

function ChipList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-xs font-medium text-slate-400">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function VentaEspecialEditContextoReadonly({ segmentacion, condicionesPago }: Props) {
  const [cpLabels, setCpLabels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    getCondicionesPago()
      .then((opts: CondicionPagoOption[]) => {
        if (cancelled) return;
        const map = new Map<string, string>();
        opts.forEach((o) => map.set(o.cndpag, o.descripcion || o.cndpag));
        setCpLabels(map);
      })
      .catch(() => {
        if (!cancelled) setCpLabels(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const clientes = (segmentacion?.clientes ?? []).map((c) => c.nrocta).filter(Boolean);
  const sucursales = (segmentacion?.sucursales ?? []).map((s) => s.sitios).filter(Boolean);
  const localidades = (segmentacion?.localidades ?? []).map(
    (l) => `${l.codpai}-${l.codpos}-${l.jurisd ?? ''}`.trim()
  );
  const mediosPago = condicionesPago.map((c) => cpLabels.get(c) ?? c);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#001f3f]">Segmentación y medios de pago</h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Solo lectura. Para cambiar la segmentación o medios de pago, creá una nueva estrategia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={panelClass}>
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0e8c85]" />
            <span className={titleClass}>Clientes ({clientes.length})</span>
          </div>
          <ChipList items={clientes} emptyLabel="Sin restricción por cliente" />
        </div>

        <div className={panelClass}>
          <div className="mb-2 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-[#0e8c85]" />
            <span className={titleClass}>Sucursales ({sucursales.length})</span>
          </div>
          <ChipList items={sucursales} emptyLabel="Sin restricción por sucursal" />
        </div>

        <div className={`${panelClass} md:col-span-2`}>
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0e8c85]" />
            <span className={titleClass}>Localidades ({localidades.length})</span>
          </div>
          <ChipList items={localidades} emptyLabel="Sin restricción por localidad" />
        </div>

        <div className={`${panelClass} md:col-span-2`}>
          <div className="mb-2 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#0e8c85]" />
            <span className={titleClass}>Medios de pago ({mediosPago.length})</span>
          </div>
          <ChipList items={mediosPago} emptyLabel="Sin condiciones de pago cargadas" />
        </div>
      </div>
    </section>
  );
}

'use client';

import { CalendarDays, Clock3 } from 'lucide-react';

import { OfertaBannerPathField } from '@/components/admin/ventas-especiales/OfertaBannerPathField';

export type VentaEspecialEditVigenciaValue = {
  disdes: string;
  dishas: string;
  descripcion: string;
  observaciones: string;
  estado: string;
  pathBanner: string;
};

type Props = {
  value: VentaEspecialEditVigenciaValue;
  onChange: (next: VentaEspecialEditVigenciaValue) => void;
  tipfin?: string | null;
  bannerImageUrl?: string | null;
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none focus:border-[#0e8c85] focus:bg-white focus:ring-2 focus:ring-[#0e8c85]/20';

function splitDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const [date = '', time = ''] = normalized.split('T');
  return { date, time: time.slice(0, 5) };
}

function joinDateTime(date: string, time: string): string {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

const HOURS_24 = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTES_60 = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

function TimeSelect24({
  value,
  onChange,
  defaultHour = '08',
  defaultMinute = '00',
}: {
  value: string;
  onChange: (value: string) => void;
  defaultHour?: string;
  defaultMinute?: string;
}) {
  const [hour = defaultHour, minute = defaultMinute] = (value || `${defaultHour}:${defaultMinute}`).split(':');
  const selectClass = `${inputClass} cursor-pointer appearance-none tabular-nums`;

  return (
    <div className="relative">
      <Clock3 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pl-9">
        <select
          aria-label="Hora"
          value={hour}
          onChange={(e) => onChange(`${e.target.value}:${minute}`)}
          className={selectClass}
        >
          {HOURS_24.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-sm font-bold text-slate-400">:</span>
        <select
          aria-label="Minutos"
          value={minute}
          onChange={(e) => onChange(`${hour}:${e.target.value}`)}
          className={selectClass}
        >
          {MINUTES_60.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function tipfinLabel(tipfin?: string | null): string {
  const t = (tipfin || '').trim().toUpperCase();
  if (t === 'S') return 'Cierre por stock';
  if (t === 'C') return 'Cuenta regresiva';
  if (t === 'B') return 'Stock y cuenta regresiva';
  return t || 'Sin definir';
}

export function VentaEspecialEditVigenciaFields({ value, onChange, tipfin, bannerImageUrl }: Props) {
  const update = <K extends keyof VentaEspecialEditVigenciaValue>(key: K, next: VentaEspecialEditVigenciaValue[K]) => {
    onChange({ ...value, [key]: next });
  };

  const desde = splitDateTime(value.disdes);
  const hasta = splitDateTime(value.dishas);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#001f3f]">Vigencia y cabecera</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Ajustá fechas de publicación, descripción y estado de la oferta.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Finalización: {tipfinLabel(tipfin)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block md:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Descripción</span>
          <input
            className={`${inputClass} mt-1`}
            value={value.descripcion}
            onChange={(e) => update('descripcion', e.target.value)}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Observaciones</span>
          <textarea
            className={`${inputClass} mt-1 min-h-[88px] py-2`}
            value={value.observaciones}
            onChange={(e) => update('observaciones', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</span>
          <input
            className={`${inputClass} mt-1`}
            value={value.estado}
            onChange={(e) => update('estado', e.target.value)}
          />
        </label>
        <div className="md:col-span-2">
          <OfertaBannerPathField
            value={value.pathBanner}
            onChange={(v) => update('pathBanner', v)}
            imageUrlFromApi={bannerImageUrl}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Publicado desde</span>
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                className={`${inputClass} pl-9`}
                value={desde.date}
                onChange={(e) => update('disdes', joinDateTime(e.target.value, desde.time || '08:00'))}
              />
            </div>
            <TimeSelect24
              value={desde.time}
              onChange={(time) => update('disdes', joinDateTime(desde.date, time))}
            />
          </div>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Publicado hasta</span>
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                className={`${inputClass} pl-9`}
                value={hasta.date}
                onChange={(e) => update('dishas', joinDateTime(e.target.value, hasta.time || '23:59'))}
              />
            </div>
            <TimeSelect24
              value={hasta.time}
              defaultHour="23"
              defaultMinute="59"
              onChange={(time) => update('dishas', joinDateTime(hasta.date, time))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

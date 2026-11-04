import { CalendarDays, Clock3, PackageCheck, Timer } from 'lucide-react';
import { OfertaBannerPathField } from '@/components/admin/ventas-especiales/OfertaBannerPathField';

export type VigenciaFormData = {
  disdes: string;
  dishas: string;
  descripcion: string;
  observaciones: string;
  pathBanner: string;
  cierrePorStock: boolean;
  cuentaRegresiva: boolean;
};

type Props = {
  value: VigenciaFormData;
  onChange: (next: VigenciaFormData) => void;
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none focus:border-[#0e8c85] focus:bg-white focus:ring-2 focus:ring-[#0e8c85]/20';

function splitDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  const [date = '', time = ''] = value.split('T');
  return { date, time: time.slice(0, 5) };
}

function joinDateTime(date: string, time: string): string {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

const TIME_24_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const HOURS_24 = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTES_60 = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

function parseTime24(time: string): { hour: string; minute: string } {
  if (!TIME_24_PATTERN.test(time)) return { hour: '', minute: '' };
  const [hour = '', minute = ''] = time.split(':');
  return { hour, minute };
}

function buildTime24(hour: string, minute: string): string {
  if (!hour || !minute) return '';
  return `${hour}:${minute}`;
}

type TimeSelect24Props = {
  value: string;
  onChange: (value: string) => void;
  defaultHour?: string;
  defaultMinute?: string;
};

function TimeSelect24({
  value,
  onChange,
  defaultHour = '08',
  defaultMinute = '00',
}: TimeSelect24Props) {
  const parsed = parseTime24(value);
  const hour = parsed.hour || defaultHour;
  const minute = parsed.minute || defaultMinute;
  const selectClass = `${inputClass} cursor-pointer appearance-none tabular-nums`;

  return (
    <div className="relative">
      <Clock3 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pl-9">
        <select
          aria-label="Hora en formato 24 horas"
          value={hour}
          onChange={(e) => onChange(buildTime24(e.target.value, minute))}
          className={selectClass}
        >
          {HOURS_24.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="text-sm font-bold text-slate-400">
          :
        </span>
        <select
          aria-label="Minutos"
          value={minute}
          onChange={(e) => onChange(buildTime24(hour, e.target.value))}
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

function formatLifeWindow(disdes: string, dishas: string): string {
  if (!disdes || !dishas) return 'Sin rango definido';
  const from = new Date(disdes);
  const to = new Date(dishas);
  const ms = to.getTime() - from.getTime();
  if (Number.isNaN(ms) || ms <= 0) return 'Rango inválido';

  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days} día${days === 1 ? '' : 's'}, ${hours} hora${hours === 1 ? '' : 's'}`;
}

export function VigenciaStep({ value, onChange }: Props) {
  const update = <K extends keyof VigenciaFormData>(key: K, nextValue: VigenciaFormData[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const desde = splitDateTime(value.disdes);
  const hasta = splitDateTime(value.dishas);
  const lifeWindow = formatLifeWindow(value.disdes, value.dishas);

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[#001f3f]">
          <CalendarDays className="h-4 w-4 text-[#0e8c85]" />
          <h2 className="text-[13px] font-black uppercase tracking-[0.18em]">Ventana de tiempo operativa</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Inicio de campaña
            </span>
            <input
              type="date"
              value={desde.date}
              onChange={(e) => update('disdes', joinDateTime(e.target.value, desde.time || '08:00'))}
              className={inputClass}
            />
            <TimeSelect24
              value={desde.time}
              defaultHour="08"
              defaultMinute="00"
              onChange={(time) => update('disdes', joinDateTime(desde.date, time))}
            />
          </div>
          <div className="space-y-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Cierre de campaña
            </span>
            <input
              type="date"
              value={hasta.date}
              onChange={(e) => update('dishas', joinDateTime(e.target.value, hasta.time || '23:59'))}
              className={inputClass}
            />
            <TimeSelect24
              value={hasta.time}
              defaultHour="23"
              defaultMinute="59"
              onChange={(time) => update('dishas', joinDateTime(hasta.date, time))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-[#ebf8f4] px-4 py-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0e8c85] text-white">
            <Timer className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0b6f69]">Tiempo de vida de oferta</p>
            <p className="text-3xl font-black italic leading-none text-[#001f3f]">{lifeWindow}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-[13px] font-black uppercase tracking-[0.18em] text-[#001f3f]">Reglas de control</h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-2xl border border-[#0e8c85]/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e8c85] text-white">
                  <PackageCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-[#001f3f]">Cierre por stock</p>
                  <p className="text-[10px] font-semibold text-slate-500">Finalizar si reserva se agota.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={value.cierrePorStock}
                onChange={(e) => update('cierrePorStock', e.target.checked)}
                className="h-4 w-4 accent-[#0e8c85]"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-[#0e8c85]/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e8c85] text-white">
                  <Timer className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-[#001f3f]">Cuenta regresiva</p>
                  <p className="text-[10px] font-semibold text-slate-500">Incentivo de urgencia.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={value.cuentaRegresiva}
                onChange={(e) => update('cuentaRegresiva', e.target.checked)}
                className="h-4 w-4 accent-[#0e8c85]"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#001f3f]">Cabecera oferta</h3>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Descripción (DESCRP) <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={value.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                placeholder="Descripción comercial de la oferta"
                className={inputClass}
                required
                aria-required="true"
              />
              {!value.descripcion.trim() ? (
                <span className="mt-1 block text-[10px] font-semibold text-amber-700">
                  La descripción es obligatoria para continuar.
                </span>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Observaciones (TEXTOS)
              </span>
              <textarea
                value={value.observaciones}
                onChange={(e) => update('observaciones', e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-all focus:border-[#0e8c85] focus:bg-white focus:ring-2 focus:ring-[#0e8c85]/20"
              />
            </label>
            <OfertaBannerPathField value={value.pathBanner} onChange={(v) => update('pathBanner', v)} />
          </div>
        </div>
      </div>
    </section>
  );
}

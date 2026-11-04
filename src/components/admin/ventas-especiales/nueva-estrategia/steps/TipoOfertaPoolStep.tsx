import type { CondicionPagoOption, TipoOfertaPool } from '@/services/admin';
import { TIPO_OFERTA_CARD_ICONS } from '../constants';
import { TipoOfertaPoolSelectCard } from '../components/TipoOfertaPoolSelectCard';

type Props = {
  tipos: TipoOfertaPool[];
  loading: boolean;
  error: string | null;
  selectedCodigo: string | null;
  onSelectCodigo: (codigo: string) => void;
  onOpenNuevoTipo: () => void;
  condicionesPago: CondicionPagoOption[];
  loadingCondicionesPago: boolean;
  errorCondicionesPago: string | null;
  condicionesPagoSeleccionadas: string[];
  onToggleCondicionPago: (cndpag: string) => void;
};

export function TipoOfertaPoolStep({
  tipos,
  loading,
  error,
  selectedCodigo,
  onSelectCodigo,
  onOpenNuevoTipo,
  condicionesPago,
  loadingCondicionesPago,
  errorCondicionesPago,
  condicionesPagoSeleccionadas,
  onToggleCondicionPago,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[15px] font-black uppercase tracking-wide text-[#001f3f] md:text-base">
            Tipo de oferta
          </h2>
          <p className="mt-1 text-[12px] font-semibold text-gray-500">
            Elegí el tipo de oferta. Los datos vienen de la base; podés dar de
            alta nuevos tipos acá.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNuevoTipo}
          className="shrink-0 rounded-[14px] border-2 border-[#001f3f] bg-[#001f3f] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white hover:bg-[#002b52]"
        >
          Nuevo tipo de oferta
        </button>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-center text-[12px] font-bold text-gray-400">Cargando tipos…</p>
      ) : tipos.length === 0 ? (
        <p className="mt-8 text-center text-[13px] font-semibold text-gray-500">
          No hay tipos cargados. Usá &quot;Nuevo tipo de oferta&quot; para crear el primero (código de hasta 2
          caracteres).
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tipos.map((tipo, idx) => {
            const Icon = TIPO_OFERTA_CARD_ICONS[idx % TIPO_OFERTA_CARD_ICONS.length]!;
            return (
              <TipoOfertaPoolSelectCard
                key={tipo.codigo}
                tipo={tipo}
                icon={Icon}
                selected={selectedCodigo === tipo.codigo}
                onSelect={() => onSelectCodigo(tipo.codigo)}
              />
            );
          })}
        </div>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="text-[14px] font-black uppercase tracking-wide text-[#001f3f]">
          Medios de pago
        </h3>
        <p className="mt-1 text-[12px] font-semibold text-gray-500">
          Seleccioná al menos una condición de pago (VTTCPH). Es solo informativa: no limita quién ve la oferta en el catálogo.
        </p>

        {errorCondicionesPago ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-800">
            {errorCondicionesPago}
          </p>
        ) : null}

        {loadingCondicionesPago ? (
          <p className="mt-4 text-[12px] font-bold text-gray-400">Cargando medios de pago…</p>
        ) : condicionesPago.length === 0 ? (
          <p className="mt-4 text-[12px] font-semibold text-gray-500">No hay condiciones de pago disponibles.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {condicionesPago.map((cp) => {
              const checked = condicionesPagoSeleccionadas.includes(cp.cndpag);
              const label = cp.descripcion?.trim()
                ? `${cp.cndpag} — ${cp.descripcion.trim()}`
                : cp.cndpag;
              return (
                <label
                  key={cp.cndpag}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition-colors ${
                    checked
                      ? 'border-[#001f3f] bg-[#001f3f]/5 text-[#001f3f]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCondicionPago(cp.cndpag)}
                    className="h-4 w-4 rounded border-gray-300 text-[#001f3f] focus:ring-[#001f3f]"
                  />
                  <span className="leading-snug">{label}</span>
                </label>
              );
            })}
          </div>
        )}

        {condicionesPagoSeleccionadas.length === 0 && !loadingCondicionesPago ? (
          <p className="mt-3 text-[11px] font-semibold text-amber-700">
            Debe seleccionar al menos un medio de pago para continuar.
          </p>
        ) : null}
      </div>
    </>
  );
}

import { ArrowRight } from 'lucide-react';
import { NUEVA_ESTRATEGIA_MINT, NUEVA_ESTRATEGIA_STEPS } from '../constants';

type Props = {
  stepIndex: number;
  puedeContinuar: boolean;
  poolthResumen: string | null;
  productosResumen?: string | null;
  payloadReady?: boolean;
  saving?: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
  onFinalizar?: () => void;
};

export function NuevaEstrategiaWizardFooter({
  stepIndex,
  puedeContinuar,
  poolthResumen,
  productosResumen,
  payloadReady,
  saving = false,
  onAnterior,
  onSiguiente,
  onFinalizar,
}: Props) {
  const total = NUEVA_ESTRATEGIA_STEPS.length;
  const isLast = stepIndex >= total - 1;

  return (
    <footer className="mt-10 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-3">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={onAnterior}
            className="rounded-[14px] border-2 border-gray-200 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#001f3f] hover:bg-gray-50"
          >
            Anterior
          </button>
        ) : null}
        {poolthResumen ? (
          <p className="text-[11px] font-bold text-gray-500">
            POOLTH: <span className="font-black text-[#001f3f]">{poolthResumen}</span>
          </p>
        ) : null}
        {productosResumen ? (
          <p className="text-[11px] font-bold text-gray-500">
            PRODUCTOS: <span className="font-black text-[#001f3f]">{productosResumen}</span>
          </p>
        ) : null}
        {payloadReady ? (
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0f766e]">Payload listo</p>
        ) : null}
      </div>
      <div className="flex justify-end sm:ml-auto">
        {!isLast ? (
          <button
            type="button"
            onClick={onSiguiente}
            disabled={!puedeContinuar}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-[14px] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#001f3f] shadow-lg transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: NUEVA_ESTRATEGIA_MINT }}
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinalizar}
            disabled={saving}
            className="min-w-[160px] rounded-[14px] bg-[#001f3f] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-md hover:bg-[#002b52]"
          >
            {saving ? 'Guardando…' : 'Finalizar'}
          </button>
        )}
      </div>
    </footer>
  );
}

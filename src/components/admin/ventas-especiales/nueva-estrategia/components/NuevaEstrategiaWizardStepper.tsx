import { NUEVA_ESTRATEGIA_MINT, NUEVA_ESTRATEGIA_STEPS } from '../constants';

type Props = {
  stepIndex: number;
  onStepChange: (index: number) => void;
};

export function NuevaEstrategiaWizardStepper({ stepIndex, onStepChange }: Props) {
  return (
    <nav aria-label="Pasos del asistente" className="border-b border-gray-200 pb-1">
      <ol className="flex flex-wrap gap-6 md:gap-10">
        {NUEVA_ESTRATEGIA_STEPS.map((label, i) => {
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => {
                  if (i <= stepIndex || done) onStepChange(i);
                }}
                className={[
                  'relative pb-3 text-[11px] font-black uppercase tracking-[0.18em] transition-colors',
                  active ? '' : done ? 'text-gray-400 hover:text-gray-600' : 'cursor-default text-gray-300',
                ].join(' ')}
                style={active ? { color: '#0f766e' } : undefined}
              >
                {label}
                {active ? (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: NUEVA_ESTRATEGIA_MINT }}
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

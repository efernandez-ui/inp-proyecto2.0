import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/** Contenedor visual común del asistente (pasos internos). */
export function NuevaEstrategiaWizardPanel({ children }: Props) {
  return (
    <div className="rounded-[24px] border border-gray-200/90 bg-white p-6 shadow-[0_12px_40px_rgba(15,35,52,0.06)] sm:p-8 md:p-10">
      {children}
    </div>
  );
}

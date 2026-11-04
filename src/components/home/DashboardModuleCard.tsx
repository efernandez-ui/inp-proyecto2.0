'use client';

import Link from 'next/link';
import type { DashboardModule } from '@/config/dashboardModules';

interface Props {
  module: DashboardModule;
  /** Si true, muestra aviso de seleccionar cliente (staff sin cliente). */
  needsClient?: boolean;
}

export default function DashboardModuleCard({ module, needsClient = false }: Props) {
  const Icon = module.icon;
  const isSoon = module.status === 'soon';
  const blocked = needsClient && module.status === 'live';

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
            isSoon || blocked ? 'bg-gray-100 text-gray-400' : 'bg-[#001f3f] text-white'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        {(isSoon || blocked) && (
          <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100">
            {isSoon ? 'Próximamente' : 'Seleccioná cliente'}
          </span>
        )}
      </div>
      <h3
        className={`mt-3 text-[15px] font-bold ${
          isSoon || blocked ? 'text-gray-500' : 'text-[#001f3f]'
        }`}
      >
        {module.title}
      </h3>
      <p className={`mt-1 text-sm leading-snug ${isSoon || blocked ? 'text-gray-400' : 'text-gray-600'}`}>
        {module.description}
      </p>
      {!isSoon && !blocked && (
        <span className="mt-3 inline-flex text-xs font-bold uppercase tracking-wide text-[#0e8c85]">
          Abrir →
        </span>
      )}
    </>
  );

  const className = `flex h-full flex-col p-5 transition ${
    isSoon || blocked ? 'opacity-70' : 'hover:bg-[#0e8c85]/5'
  }`;

  if (isSoon || blocked || !module.href) {
    return (
      <div className={className} aria-disabled>
        {body}
      </div>
    );
  }

  return (
    <Link href={module.href} className={className}>
      {body}
    </Link>
  );
}

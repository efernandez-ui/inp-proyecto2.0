'use client';

import { SUCURSALES, type Sucursal } from '@/data/sucursales';

const pageTitleClass = 'text-2xl font-black tracking-tight text-[#312782] sm:text-3xl';
const supportingTextClass = 'mt-2 text-sm leading-6 text-slate-600 sm:text-base';

function BranchCard({ branch, featured = false }: { branch: Sucursal; featured?: boolean }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className={`${featured ? 'h-[180px]' : 'h-[150px]'} bg-slate-100`}>
        <iframe
          src={branch.mapSrc}
          title={`Mapa de ${branch.name}`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#312782]">
            {branch.type}
          </p>
          <h3 className={`mt-1 font-black text-[#312782] ${featured ? 'text-xl' : 'text-lg'}`}>
            {branch.name}
          </h3>
          <p className={`${featured ? 'text-sm' : 'text-xs'} mt-2 font-semibold leading-5 text-slate-700`}>
            {branch.address}
          </p>
          <p className={`${featured ? 'text-sm' : 'text-xs'} mt-2 font-bold text-slate-900`}>
            Tel.: {branch.phone}
          </p>
        </div>
        <a
          href={branch.directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#312782] px-4 text-[11px] font-black uppercase text-white transition hover:bg-[#251f66]"
        >
          ¿Cómo llegar?
        </a>
      </div>
    </article>
  );
}

export default function SucursalesInfoSection() {
  return (
    <section>
      <header className="border-b border-slate-200 pb-5">
        <h1 className={pageTitleClass}>Sucursales</h1>
        <p className={supportingTextClass}>
          Almacenes ubicados en zonas estratégicas para llegar a todo el país.
        </p>
      </header>
      <div className="space-y-5 pt-7">
        <div className="grid gap-5 lg:grid-cols-2">
          {SUCURSALES.slice(0, 2).map((branch) => (
            <BranchCard key={branch.name} branch={branch} featured />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {SUCURSALES.slice(2).map((branch) => (
            <BranchCard key={branch.name} branch={branch} />
          ))}
        </div>
      </div>
    </section>
  );
}

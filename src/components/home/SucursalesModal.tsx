'use client'

import { X } from 'lucide-react'
import Modal from '@/components/modals/Modal'
import { SUCURSALES, type Sucursal } from '@/data/sucursales'

function BranchCard({ branch, compact }: { branch: Sucursal; compact?: boolean }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className={compact ? 'h-[150px] bg-slate-100' : 'h-[180px] bg-slate-100'}>
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
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
            {branch.type}
          </p>
          <h3 className={`mt-1 font-black text-[#39328b] ${compact ? 'text-lg' : 'text-xl'}`}>
            {branch.name}
          </h3>
          <p className={`mt-2 font-semibold leading-5 text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            {branch.address}
          </p>
          <p className={`mt-2 font-bold text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
            Tel.: {branch.phone}
          </p>
        </div>
        <a
          href={branch.directionsUrl}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-black uppercase text-white transition hover:bg-blue-500 ${
            compact ? 'h-9 px-4 text-[11px]' : 'h-10 px-5 text-xs'
          }`}
        >
          ¿Cómo Llegar?
        </a>
      </div>
    </article>
  )
}

export default function SucursalesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="relative flex max-h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
    >
      <div className="flex items-start justify-between border-b border-[#39328b]/20 px-6 py-4">
        <div>
          <h2 className="text-3xl font-black text-[#39328b]">Sucursales</h2>
          <p className="mt-1 text-base font-medium text-[#51499d]">
            Almacenes ubicados en zonas estratégicas para llegar a todo el país.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-5 overflow-y-auto p-5">
        <div className="grid gap-5 lg:grid-cols-2">
          {SUCURSALES.slice(0, 2).map((branch) => (
            <BranchCard key={branch.name} branch={branch} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {SUCURSALES.slice(2).map((branch) => (
            <BranchCard key={branch.name} branch={branch} compact />
          ))}
        </div>
      </div>
    </Modal>
  )
}

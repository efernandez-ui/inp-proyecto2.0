import Link from 'next/link';

export function NuevaEstrategiaBackLink() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/admin/ventas-especiales"
        className="text-[11px] font-black uppercase tracking-widest text-[#2563eb] underline-offset-2 hover:underline"
      >
        ← Ver listado de estrategias
      </Link>
    </div>
  );
}

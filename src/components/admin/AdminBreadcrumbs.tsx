'use client';

import Link from 'next/link';
import { useMemo } from 'react';

type Crumb = { label: string; href: string | null };

/** Etiquetas legibles opcionales; si no hay entrada, se muestra el segmento de URL tal cual. */
const SEGMENT_LABEL: Record<string, string> = {
  parametros: 'Parámetros',
  general: 'General',
  banners: 'Banners',
  notificaciones: 'Notificaciones',
  carritos: 'Carritos',
  'solicitud-cliente': 'Solicitud de cliente',
  catalogo: 'Catálogo',
  nueva: 'Nueva estrategia',
  'ventas-especiales': 'Ventas especiales',
  'cuenta-corriente': 'Cuenta corriente',
  'correos-no-enviados': 'Correos no enviados',
};

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] !== 'admin') return [];

  const out: Crumb[] = [{ label: 'Administración', href: '/admin/ventas-especiales' }];

  if (parts.length === 1) {
    out.push({ label: 'Ventas especiales', href: null });
    return out;
  }

  // Evitar "Panel principal" intermedio: Administración → … segmentos
  let acc = '/admin';
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i];
    acc += `/${seg}`;
    const isLast = i === parts.length - 1;
    const label = SEGMENT_LABEL[seg] ?? seg;
    out.push({ label, href: isLast ? null : acc });
  }

  return out;
}

type Props = {
  pathname: string;
};

export function AdminBreadcrumbs({ pathname }: Props) {
  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Ruta" className="mb-5 flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-[11px] font-semibold tracking-tight text-gray-500">
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="inline-flex items-baseline gap-1">
          {i > 0 ? <span className="text-gray-300 select-none">/</span> : null}
          {c.href != null ? (
            <Link href={c.href} className="text-[#2563eb] hover:underline">
              {c.label}
            </Link>
          ) : (
            <span className="font-black uppercase text-[#001f3f]">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

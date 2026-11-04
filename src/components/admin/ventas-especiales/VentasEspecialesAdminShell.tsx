'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, List } from 'lucide-react';
import { AdminPanelPrincipal } from '@/components/admin/AdminPanelPrincipal';
import { VentasEspecialesListSection } from '@/components/admin/ventas-especiales/VentasEspecialesListSection';

type TabId = 'resumen' | 'gestion';

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'gestion', label: 'Gestión', icon: List },
];

function VentasEspecialesAdminTabs() {
  const pathname = usePathname() || '/admin/ventas-especiales';
  const searchParams = useSearchParams();
  const active: TabId = searchParams?.get('tab') === 'gestion' ? 'gestion' : 'resumen';

  return (
    <div className="w-full min-w-0 space-y-4">
      <nav
        className="flex gap-0 overflow-x-auto border-b border-gray-200 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Secciones de ventas especiales"
      >
        {TABS.map((tab) => {
          const href =
            tab.id === 'gestion' ? `${pathname}?tab=gestion` : pathname;
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={href}
              prefetch
              className={[
                'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[11px] font-black uppercase tracking-wide transition sm:gap-2.5 sm:px-4 sm:text-xs',
                isActive
                  ? '-mb-px border-[#0e8c85] text-[#001f3f]'
                  : 'border-transparent text-gray-500 hover:text-[#001f3f]',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0">
        {active === 'gestion' ? <VentasEspecialesListSection /> : <AdminPanelPrincipal />}
      </div>
    </div>
  );
}

/**
 * Unifica Panel admin (overview) + listado de ventas especiales en dos solapas.
 * Query `?tab=gestion` abre Gestión; por defecto Resumen.
 */
export function VentasEspecialesAdminShell() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-gray-500">Cargando...</div>
      }
    >
      <VentasEspecialesAdminTabs />
    </Suspense>
  );
}

'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import DashboardShell from '@/components/home/DashboardShell';
import { canAccessPanel, isAdmin } from '@/utils/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/admin';
  const { user, isLoggedIn, isLoading } = useSelector((s: RootState) => s.auth);
  const panelAccess = canAccessPanel(user);
  const admin = isAdmin(user);

  const isParametrosOrRestricted =
    pathname.startsWith('/admin/parametros') ||
    pathname.startsWith('/admin/correos-no-enviados') ||
    pathname.startsWith('/admin/sync');

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) return void router.replace('/');
    if (!panelAccess) return void router.replace('/');
    // Parámetros / sync / correos: solo admin A
    if (isParametrosOrRestricted && !admin) {
      return void router.replace('/admin/ventas-especiales');
    }
  }, [isLoading, isLoggedIn, panelAccess, admin, isParametrosOrRestricted, router]);

  const visible =
    !isLoading &&
    isLoggedIn &&
    panelAccess &&
    !(isParametrosOrRestricted && !admin);

  const headerTitle = useMemo(() => {
    if (pathname === '/admin' || pathname === '/admin/ventas-especiales') return 'Ventas especiales';
    if (pathname?.startsWith('/admin/ventas-especiales/nueva')) return 'Nueva estrategia';
    if (pathname?.startsWith('/admin/ventas-especiales')) return 'Ventas especiales';
    if (pathname?.startsWith('/admin/cuenta-corriente')) return 'Cuenta corriente';
    if (pathname?.startsWith('/admin/correos-no-enviados')) return 'Correos no enviados';
    const sub = pathname?.match(/^\/admin\/parametros\/([^/]+)/)?.[1];
    const parametroTitulos: Record<string, string> = {
      general: 'General',
      banners: 'Banners',
      'solicitud-cliente': 'Solicitud de cliente',
      notificaciones: 'Notificaciones',
      catalogo: 'Catálogo',
      carritos: 'Carritos',
    };
    if (pathname?.startsWith('/admin/parametros')) {
      if (sub && parametroTitulos[sub]) return `Parámetros · ${parametroTitulos[sub]}`;
      return 'Parámetros';
    }
    return 'Administración';
  }, [pathname]);

  if (!visible) return null;

  return (
    <DashboardShell>
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
          Administración
        </div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#001f3f]">
          {headerTitle}
        </h1>
      </div>
      <div className="p-4 lg:p-6">
        <AdminBreadcrumbs pathname={pathname} />
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </DashboardShell>
  );
}

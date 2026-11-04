'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { isStaff } from '@/utils/auth';
import {
  getDashboardModules,
  type DashboardGroupId,
  type DashboardModule,
} from '@/config/dashboardModules';
import DashboardSidebar from './DashboardSidebar';

function findActiveModule(
  pathname: string,
  modules: DashboardModule[],
): DashboardModule | undefined {
  return modules
    .filter((m) => m.href && m.status === 'live')
    .filter((m) => pathname === m.href || pathname.startsWith(`${m.href}/`))
    .sort((a, b) => (b.href!.length - a.href!.length))[0];
}

interface Props {
  children: React.ReactNode;
  /** Filtro de grupo en home (opcional). Si no se pasa, se deriva de la ruta. */
  filterGroup?: DashboardGroupId | 'all';
  onFilterGroup?: (group: DashboardGroupId | 'all') => void;
}

/**
 * Shell persistente: sidebar navy docked (estilo catálogo) + contenido.
 * Usar en home, cuenta corriente, carrito y admin.
 * Clientes (C/P): sin sidebar PANEL, solo contenido a ancho completo.
 */
export default function DashboardShell({ children, filterGroup, onFilterGroup }: Props) {
  const { user } = useSelector((s: RootState) => s.auth);
  const pathname = usePathname() || '/';
  const router = useRouter();
  const modules = useMemo(() => getDashboardModules(user), [user]);
  const showSidebar = isStaff(user);

  const derivedGroup = useMemo(() => {
    const active = findActiveModule(pathname, modules);
    return active?.group ?? 'all';
  }, [pathname, modules]);

  const activeGroup = filterGroup ?? derivedGroup;

  const onSelectGroup = (group: DashboardGroupId | 'all') => {
    if (onFilterGroup) {
      onFilterGroup(group);
      if (pathname !== '/') router.push('/');
      return;
    }
    if (group === 'all') {
      router.push('/');
      return;
    }
    const firstLive = modules.find((m) => m.group === group && m.status === 'live' && m.href);
    router.push(firstLive?.href ?? '/');
  };

  if (!showSidebar) {
    return <div className="min-h-screen bg-[#f2f2f2]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f2f2] lg:flex-row">
      <DashboardSidebar
        modules={modules}
        activeGroup={activeGroup}
        onSelectGroup={onSelectGroup}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

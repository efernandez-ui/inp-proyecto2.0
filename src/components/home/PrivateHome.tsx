'use client';

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
  DASHBOARD_GROUP_LABELS,
  getDashboardModules,
  type DashboardGroupId,
} from '@/config/dashboardModules';
import { isStaff } from '@/utils/auth';
import DashboardModuleCard from './DashboardModuleCard';
import DashboardShell from './DashboardShell';

export default function PrivateHome() {
  const { user } = useSelector((state: RootState) => state.auth);
  const selectedClient = useSelector((state: RootState) => state.auth.selectedClient);
  const [activeGroup, setActiveGroup] = useState<DashboardGroupId | 'all'>('all');

  const modules = useMemo(() => getDashboardModules(user), [user]);
  const visibleModules = useMemo(
    () => (activeGroup === 'all' ? modules : modules.filter((m) => m.group === activeGroup)),
    [modules, activeGroup],
  );

  const staff = isStaff(user);
  const needsClient = staff && !selectedClient?.nrocta;
  const groupTitle =
    activeGroup === 'all' ? 'Todos los módulos' : DASHBOARD_GROUP_LABELS[activeGroup];

  return (
    <DashboardShell filterGroup={activeGroup} onFilterGroup={setActiveGroup}>
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0e8c85]">
          Panel de control
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#001f3f] sm:text-3xl">
          ¡Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}!
        </h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
          {user?.descripcionTipo && (
            <span>
              Tipo:{' '}
              <strong className="font-semibold text-[#001f3f]">{user.descripcionTipo}</strong>
            </span>
          )}
          {staff ? (
            <span>
              Operando para:{' '}
              <strong className="font-semibold text-[#001f3f]">
                {selectedClient?.nrocta
                  ? `${selectedClient.nrocta}${selectedClient.nombre ? ` — ${selectedClient.nombre}` : ''}`
                  : 'Sin cliente seleccionado'}
              </strong>
            </span>
          ) : (
            user?.nrocta && (
              <span>
                Cuenta: <strong className="font-semibold text-[#001f3f]">{user.nrocta}</strong>
              </span>
            )
          )}
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">
            {groupTitle}
          </h2>
          <span className="text-xs text-gray-400">
            {visibleModules.length} módulo{visibleModules.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleModules.map((mod) => (
            <div key={mod.id} className="border border-gray-200 bg-white">
              <DashboardModuleCard
                module={mod}
                needsClient={
                  needsClient && (mod.id === 'cuenta-corriente' || mod.id === 'carritos')
                }
              />
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

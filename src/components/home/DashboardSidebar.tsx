'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp, LayoutGrid, Menu, X } from 'lucide-react';
import type { DashboardGroupId, DashboardModule } from '@/config/dashboardModules';
import { getDashboardGroups } from '@/config/dashboardModules';

interface Props {
  modules: DashboardModule[];
  activeGroup: DashboardGroupId | 'all';
  onSelectGroup: (group: DashboardGroupId | 'all') => void;
}

export default function DashboardSidebar({ modules, activeGroup, onSelectGroup }: Props) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const pathname = usePathname() || '/';
  const groups = getDashboardGroups(modules);

  const activeHref = modules
    .filter((m) => m.href && m.status === 'live')
    .filter((m) => pathname === m.href || pathname.startsWith(`${m.href}/`))
    .sort((a, b) => (b.href!.length - a.href!.length))[0]?.href;

  const selectGroup = (group: DashboardGroupId | 'all') => {
    onSelectGroup(group);
    setIsOpenMobile(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpenMobile(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-[#0e8c85] text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold"
      >
        <Menu size={20} /> MENÚ
      </button>

      <aside
        className={`
          fixed inset-y-0 left-0 z-[60] w-[280px] bg-[#001f3f] text-white transition-transform duration-300 transform
          lg:relative lg:translate-x-0 lg:z-0 lg:w-[240px] lg:min-h-screen
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4 flex justify-between items-center border-b border-blue-900/50">
          <h2 className="text-[18px] font-black tracking-tighter italic">PANEL</h2>
          <button type="button" onClick={() => setIsOpenMobile(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto max-h-[calc(100vh-60px)] custom-scrollbar px-3 py-3 pb-20 lg:pb-4">
          <NavItem
            label="Todos los módulos"
            icon={LayoutGrid}
            active={pathname === '/' && activeGroup === 'all'}
            onClick={() => selectGroup('all')}
          />

          {groups.map((group) => (
            <PanelSection
              key={group.id}
              title={group.label}
              badge={String(group.modules.length)}
              isOpen
              onTitleClick={() => selectGroup(group.id)}
              titleActive={activeGroup === group.id}
            >
              {group.modules.map((mod) => {
                const Icon = mod.icon;
                const isSoon = mod.status === 'soon';
                const isRouteActive = Boolean(mod.href && mod.href === activeHref);

                if (isSoon || !mod.href) {
                  return (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 opacity-45 cursor-default"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="h-4 w-4 shrink-0 text-blue-400" strokeWidth={2.2} />
                        <span className="truncate text-[11px] font-bold uppercase text-blue-300">
                          {mod.title}
                        </span>
                      </div>
                      <span className="shrink-0 text-[9px] font-semibold uppercase text-blue-400">
                        Pronto
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={mod.id}
                    href={mod.href}
                    onClick={() => setIsOpenMobile(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition ${
                      isRouteActive
                        ? 'bg-[#0e8c85] text-white shadow-[0_4px_14px_rgba(14,140,133,0.35)]'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${isRouteActive ? 'text-white' : 'text-blue-300'}`}
                      strokeWidth={2.2}
                    />
                    <span className="truncate text-[11px] font-bold uppercase tracking-wide">
                      {mod.title}
                    </span>
                  </Link>
                );
              })}
            </PanelSection>
          ))}
        </div>
      </aside>

      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}
    </>
  );
}

function PanelSection({
  title,
  children,
  badge,
  isOpen: initialOpen = false,
  onTitleClick,
  titleActive,
}: {
  title: string;
  children: React.ReactNode;
  badge?: string;
  isOpen?: boolean;
  onTitleClick?: () => void;
  titleActive?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div className="mt-3 border-t border-blue-900/40 pt-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onTitleClick ?? (() => setOpen(!open))}
          className="flex items-center gap-2 text-left"
        >
          <h3
            className={`text-[10px] font-black tracking-widest uppercase ${
              titleActive ? 'text-[#0e8c85]' : 'text-blue-300'
            }`}
          >
            {title}
          </h3>
          {badge && (
            <span className="bg-[#002d5a] text-blue-100 text-[9px] font-bold px-1.5 min-w-[18px] h-4 flex items-center justify-center rounded-full">
              {badge}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setOpen(!open)} className="text-blue-400">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && <div className="flex flex-col gap-1">{children}</div>}
    </div>
  );
}

function NavItem({
  label,
  icon: Icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
        active
          ? 'bg-[#0e8c85] text-white shadow-[0_4px_14px_rgba(14,140,133,0.35)]'
          : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-blue-300'}`} strokeWidth={2.2} />
      <span className="truncate text-[11px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
}

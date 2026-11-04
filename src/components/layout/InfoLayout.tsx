'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

const sections = [
  { key: 'sobreNosotros', label: 'Sobre nosotros', route: '/info/sobre-nosotros' },
  { key: 'bancos', label: 'Bancos', route: '/info/bancos' },
  { key: 'informacionUtil', label: 'Información útil', route: '/info/informacion-util' },
  { key: 'ayudaRapida', label: 'Ayuda', route: '/info/ayuda-rapida' },
  { key: 'almacenes', label: 'Sucursales', route: '/info/almacenes' },
  { key: 'formaParte', label: 'Forma parte', route: '/info/forma-parte' },
  { key: 'quieroSerCliente', label: 'Quiero ser cliente', route: '/info/quiero-ser-cliente' },
];

interface InfoLayoutProps {
  children: React.ReactNode;
}

const InfoLayout: React.FC<InfoLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const activeRoute =
    sections.find((s) => pathname === s.route || pathname?.startsWith(`${s.route}/`))?.route || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4 md:hidden">
          <span className="font-bold text-gray-800">Secciones</span>
          <select
            className="flex-grow rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:ring-2 focus:ring-[#1a79ff]/30"
            onChange={(e) => handleNavigation(e.target.value)}
            value={activeRoute}
          >
            {sections.map((s) => (
              <option key={s.key} value={s.route}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <nav className="mb-6 hidden gap-3 overflow-x-auto pb-4 md:flex">
          {sections.map((section) => {
            const isActive = activeRoute === section.route;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => handleNavigation(section.route)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a79ff] ${
                  isActive
                    ? 'bg-[#1a79ff] text-white shadow-sm'
                    : 'text-[#312782] hover:bg-slate-100 hover:text-[#1a79ff]'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </nav>
        <main className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">{children}</main>
      </div>
    </div>
  );
};

export default InfoLayout;

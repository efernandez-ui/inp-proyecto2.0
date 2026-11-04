'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, DatabaseZap, FileText, Images, LayoutGrid, ShoppingCart } from 'lucide-react';

const ITEMS = [
  { href: '/admin/parametros/general', label: 'Conf. general', icon: LayoutGrid },
  { href: '/admin/parametros/banners', label: 'Banners', icon: Images },
  { href: '/admin/parametros/solicitud-cliente', label: 'Solicitud de cliente', icon: FileText },
  { href: '/admin/parametros/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/admin/parametros/carritos', label: 'Carritos', icon: ShoppingCart },
  { href: '/admin/parametros/catalogo', label: 'Catálogo', icon: DatabaseZap },
] as const;

/**
 * Navegación por pestañas horizontales: libera el ancho para tablas (p. ej. Banners).
 */
export function ParametrosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <div className="w-full min-w-0">
      <div className="-mx-1 bg-white px-1 sm:mx-0 sm:px-0">
        <nav
          className="flex gap-0 overflow-x-auto border-b border-gray-200 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Secciones de parámetros"
        >
          {ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={[
                  'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[11px] font-black uppercase tracking-wide transition sm:gap-2.5 sm:px-4 sm:text-xs',
                  active
                    ? '-mb-px border-[#0e8c85] text-[#001f3f]'
                    : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-800',
                ].join(' ')}
              >
                <Icon className={`h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px] ${active ? 'text-[#0e8c85]' : 'text-gray-400'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="min-w-0 pt-5">{children}</div>
    </div>
  );
}

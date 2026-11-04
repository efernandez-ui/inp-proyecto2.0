'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { canAccessCuentaCorriente } from '@/utils/auth';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

const LINKS = [
  { href: '/cuenta-corriente', label: 'Cuenta corriente' },
  { href: '/cobra-con-inpay', label: 'Cobrá con INPay' },
] as const;

export default function FinanzasSubNav() {
  const pathname = usePathname() || '';
  const { user, isLoggedIn } = useSelector((s: RootState) => s.auth);

  if (!isLoggedIn || !canAccessCuentaCorriente(user)) return null;

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-gray-200 pb-4"
      aria-label="Navegación finanzas"
    >
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition ${
              active
                ? 'bg-[#001f3f] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

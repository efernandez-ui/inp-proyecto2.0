'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  isCatalogNavActive,
  isHomeNavActive,
  isNavLinkActive,
} from '@/utils/navLinkActive';
import CotizacionDolarLabel from './CotizacionDolarLabel';
import type { Bitrix24FormKey } from '@/config/bitrix24Forms';

const DRAWER_BG = '#121e3d';

export type MobileNavLink = {
  name: string;
  href: string;
  highlight?: boolean;
  bitrixForm?: Bitrix24FormKey;
  popup?: 'sucursales';
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  links: MobileNavLink[];
  pathname: string;
  onCatalogClick: () => void;
  onBitrixFormClick?: (formKey: Bitrix24FormKey) => void;
  onSucursalesClick?: () => void;
};

function drawerItemClass(active: boolean, highlight?: boolean): string {
  const base =
    'block w-full py-4 text-left text-lg font-bold tracking-wide transition-colors rounded-lg px-2 -mx-2';
  if (active) {
    return `${base} uppercase bg-white/10 text-white`;
  }
  if (highlight) {
    return `${base} uppercase text-[#0e8c85]`;
  }
  return `${base} uppercase text-white`;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  links,
  pathname,
  onCatalogClick,
  onBitrixFormClick,
  onSucursalesClick,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleCatalog = () => {
    onClose();
    onCatalogClick();
  };

  const homeActive = isHomeNavActive(pathname);
  const catalogActive = isCatalogNavActive(pathname);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10040] bg-black/55 md:hidden"
            onClick={onClose}
          />
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-[10050] flex w-[78%] max-w-[300px] flex-col md:hidden"
            style={{ backgroundColor: DRAWER_BG }}
            aria-label="Menú principal"
          >
            <div className="flex justify-end px-4 pt-4 pb-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="flex flex-col px-6 pt-2 pb-8">
              <li>
                <Link
                  href="/"
                  onClick={onClose}
                  aria-current={homeActive ? 'page' : undefined}
                  className={`block w-full py-4 text-left text-lg font-bold tracking-wide transition-colors rounded-lg px-2 -mx-2 ${
                    homeActive ? 'bg-white/10 text-white' : 'text-white'
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleCatalog}
                  aria-current={catalogActive ? 'page' : undefined}
                  className={drawerItemClass(catalogActive)}
                >
                  Catálogo
                </button>
              </li>
              {links.map((link) => {
                const active = isNavLinkActive(pathname, link.href);

                if (link.bitrixForm) {
                  return (
                    <li key={link.name}>
                      <button
                        type="button"
                        onClick={() => {
                          onBitrixFormClick?.(link.bitrixForm!);
                          onClose();
                        }}
                        className={drawerItemClass(false, link.highlight)}
                      >
                        {link.name}
                      </button>
                    </li>
                  );
                }

                if (link.popup === 'sucursales') {
                  return (
                    <li key={link.name}>
                      <button
                        type="button"
                        onClick={() => {
                          onSucursalesClick?.();
                          onClose();
                        }}
                        className={drawerItemClass(false, link.highlight)}
                      >
                        {link.name}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={drawerItemClass(active, link.highlight)}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-2">
                <CotizacionDolarLabel variant="drawer" />
              </li>
            </ul>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

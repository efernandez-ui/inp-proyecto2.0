'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { CircleUser, LayoutDashboard, LogOut, User } from 'lucide-react';
import type { RootState } from '@/store';
import { canAccessPanel } from '@/utils/auth';

interface Props {
  onLogout: () => void;
  compact?: boolean;
}

export default function UserProfileMenu({ onLogout, compact = false }: Props) {
  const { user } = useSelector((s: RootState) => s.auth);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const showPanel = canAccessPanel(user);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-flex items-center self-center shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? 'flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#001f3f] shrink-0'
            : 'hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#001f3f] shrink-0 hover:bg-gray-100 transition-colors'
        }
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        <CircleUser className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-[10001] w-44 rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl">
          <Link
            href="/mis-datos"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#001f3f] hover:bg-gray-50 transition-colors"
          >
            <User className="h-4 w-4 shrink-0" />
            Mi perfil
          </Link>
          <div className="my-1 border-t border-gray-100" />
          {showPanel && (
            <Link
              href="/admin/ventas-especiales"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#001f3f] hover:bg-gray-50 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Panel
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-bold uppercase text-[#0e8c85] hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Salir
          </button>
        </div>
      )}
    </div>
  );
}

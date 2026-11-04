'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { canAccessCuentaCorriente, isStaff } from '@/utils/auth';
import {
  fetchAlerta,
  formatCurrency,
  type CuentaCorrienteAlerta,
} from '@/services/cuentaCorriente';

/** Umbral de saldo vencido (ARS) a partir del cual se muestra la campanita. */
const UMBRAL_SALDO_VENCIDO = 10_000;

interface Props {
  /** Estilo compacto para el header mobile. */
  compact?: boolean;
}

function toAlertaNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default function SaldoVencidoBell({ compact = false }: Props) {
  const { user, isLoggedIn, selectedClient } = useSelector((s: RootState) => s.auth);
  const [staffAlerta, setStaffAlerta] = useState<CuentaCorrienteAlerta | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const staff = isStaff(user);
  const nrocta = staff ? selectedClient?.nrocta : undefined;
  const canShow =
    isLoggedIn &&
    canAccessCuentaCorriente(user) &&
    (!staff || Boolean(nrocta));

  useEffect(() => {
    if (!canShow) {
      setStaffAlerta(null);
      return;
    }

    if (!staff) {
      setStaffAlerta(null);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setStaffAlerta(null);
      return;
    }

    let cancelled = false;
    fetchAlerta(token, nrocta)
      .then((data) => {
        if (!cancelled) setStaffAlerta(data);
      })
      .catch(() => {
        if (!cancelled) setStaffAlerta(null);
      });

    return () => {
      cancelled = true;
    };
  }, [canShow, staff, nrocta]);

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

  const alerta = staff ? staffAlerta : user?.ccAlerta ?? null;
  const saldoVencido = toAlertaNumber(alerta?.saldoVencido);
  const docs = toAlertaNumber(alerta?.documentosVencidos);
  const visible = Boolean(alerta) && saldoVencido > UMBRAL_SALDO_VENCIDO && docs > 0;

  if (!visible) return null;

  const href = staff && nrocta
    ? `/cuenta-corriente?nrocta=${encodeURIComponent(nrocta)}`
    : '/cuenta-corriente';
  const badgeLabel = docs > 99 ? '99+' : String(docs);

  return (
    <div ref={wrapRef} className="relative inline-flex items-center self-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex items-center justify-center leading-none group transition-transform hover:scale-110 ${
          compact ? 'p-1' : ''
        }`}
        title={`${docs} documento${docs === 1 ? '' : 's'} con saldo vencido`}
        aria-label={`Saldo vencido: ${docs} documentos`}
        aria-expanded={open}
      >
        {compact ? (
          <Bell className="h-6 w-6 text-red-400 fill-red-500" />
        ) : (
          <div className="inline-flex items-center justify-center p-2 rounded-full border border-red-400/50 bg-red-600 group-hover:bg-red-500 transition-colors">
            <Bell className="h-5 w-5 text-white fill-white" />
          </div>
        )}
        <span
          className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#001f3f] shadow-lg ${
            compact ? 'w-4 h-4 min-w-4' : 'min-w-5 h-5 w-5'
          }`}
        >
          {badgeLabel}
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 z-[10001] w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-red-200 bg-white text-[#001f3f] shadow-xl"
        >
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 rounded-t-xl">
            <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">
              Saldo vencido
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              Tenés{' '}
              <span className="font-black text-red-600">{docs}</span>{' '}
              documento{docs === 1 ? '' : 's'} pendiente
              {docs === 1 ? '' : 's'} de pago
            </p>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Monto vencido</span>
              <span className="font-bold text-red-600">{formatCurrency(saldoVencido)}</span>
            </div>
            <Link
              href={href}
              onClick={() => setOpen(false)}
              className="mt-1 flex w-full items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-red-700 transition-colors"
            >
              Ver cuenta corriente
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

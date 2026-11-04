'use client';

import Link from 'next/link';
import { Briefcase, Crosshair, MapPin, UserRound } from 'lucide-react';
import type { OfertaEstadisticas } from '@/services/admin';

const NAVY = '#001f3f';
const GREEN = '#22c55e';
const TRACK = '#e8ecf1';

export function fmtInt(n: number | null | undefined): string {
  return Math.round(Number(n ?? 0)).toLocaleString('es-AR');
}

export function fmtMoneyFull(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `$ ${Math.round(Number(n)).toLocaleString('es-AR')}`;
}

function fmtMoneyCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  const v = Number(n);
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${Math.round(v)}`;
}

function fmtPct(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `${Number(n).toFixed(digits)}%`;
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

type Props = {
  stats: OfertaEstadisticas;
  /** Muestra el botón "Editar pool" (solo en el Resumen; en el detalle ya se está editando). */
  showEditarPool?: boolean;
};

export function OfertaEstadisticasPanel({ stats, showEditarPool = false }: Props) {
  const publicada = Number(stats.cantidadPublicada ?? 0);
  const vendidas = Number(stats.cantidadVendida ?? 0);
  const cobertura = stats.coberturaPct != null ? Number(stats.coberturaPct) : publicada > 0 ? (vendidas / publicada) * 100 : 0;

  const productos = stats.productos ?? [];
  const disponible =
    productos.length > 0
      ? productos.reduce((acc, p) => acc + Number(p.cantidadDisponible ?? 0), 0)
      : Math.max(0, publicada - Number(stats.cantidadConsumida ?? 0));

  const penetracion = stats.penetracion;
  const clientesUnicos = Number(penetracion?.clientesUnicos ?? 0);
  const sucursalesConVenta = Number(penetracion?.sucursalesConVenta ?? 0);
  const sucursalesTexto = (penetracion?.sucursales ?? []).filter(Boolean).join(', ');

  const mix = stats.mixSucursales ?? [];
  const top = stats.topComerciales ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Avance de unidades */}
        <div className="rounded-[18px] border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/90 text-white">
                <Crosshair className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[10px] font-black uppercase leading-tight tracking-wider text-gray-600">
                Avance de<br />unidades
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-black" style={{ color: GREEN }}>{fmtPct(cobertura)}</p>
              <p className="text-[10px] font-bold leading-tight text-gray-500">Cobertura<br />Pool</p>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="text-4xl font-black tabular-nums" style={{ color: NAVY }}>{fmtInt(vendidas)}</p>
            <p className="pb-1 text-right text-[11px] font-bold text-gray-500">
              de {fmtInt(publicada)} publicadas
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: TRACK }}>
            <div className="h-full rounded-full" style={{ width: `${clampPct(cobertura)}%`, backgroundColor: GREEN }} />
          </div>
          <p className="mt-2 text-right text-[11px] font-bold text-gray-500">{fmtInt(disponible)} disponibles</p>
        </div>

        {/* Penetración clientes */}
        <div className="rounded-[18px] border border-fuchsia-100 bg-fuchsia-50/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-500/90 text-white">
                <UserRound className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[10px] font-black uppercase leading-tight tracking-wider text-gray-600">
                Penetración<br />clientes
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-fuchsia-600">{fmtInt(clientesUnicos)} Clientes</p>
              <p className="text-[10px] font-bold text-gray-500">B2B</p>
            </div>
          </div>
          {clientesUnicos > 0 ? (
            <>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-4xl font-black tabular-nums" style={{ color: NAVY }}>
                  {fmtInt(sucursalesConVenta)} <span className="text-xl">Suc.</span>
                </p>
              </div>
              <p className="mt-3 text-[11px] font-semibold leading-relaxed text-gray-500">
                {fmtInt(clientesUnicos)} cuentas con reservas confirmadas
                {sucursalesTexto ? <> en {sucursalesTexto}</> : null}.
              </p>
            </>
          ) : (
            <p className="mt-6 text-sm font-bold text-gray-400">Sin ventas confirmadas por cliente.</p>
          )}
        </div>

        {/* Mix por sucursal */}
        <div className="rounded-[18px] border border-orange-100 bg-orange-50/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/90 text-white">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[10px] font-black uppercase leading-tight tracking-wider text-gray-600">
                Mix por<br />sucursal
              </span>
            </div>
          </div>
          {mix.length > 0 ? (
            <div className="mt-5 space-y-3">
              {mix.slice(0, 6).map((row) => {
                const code = (row.codigo || row.nombre || '—').slice(0, 6);
                const p = clampPct(Number(row.porcentaje ?? 0));
                return (
                  <div key={`${code}-${row.nombre}`} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-[11px] font-black text-gray-600" title={row.nombre ?? undefined}>
                      {code} <span className="font-bold text-gray-400">({p.toFixed(1)}%):</span>
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: TRACK }}>
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${p}%` }} />
                    </div>
                    <span className="w-20 shrink-0 text-right text-[11px] font-black" style={{ color: NAVY }}>
                      {fmtInt(row.cantidadVendida)} u / {fmtInt(row.clientes)} cli
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm font-bold text-gray-400">Sin ventas confirmadas por sucursal.</p>
          )}
        </div>

        {/* Top comerciales */}
        <div className="rounded-[18px] border border-amber-100 bg-amber-50/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/90 text-white">
                <Briefcase className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[10px] font-black uppercase leading-tight tracking-wider text-gray-600">
                Top<br />comerciales
              </span>
            </div>
          </div>
          {top.length > 0 ? (
            <ol className="mt-4 space-y-2">
              {top.slice(0, 5).map((row, idx) => (
                <li key={`${idx}-${row.vendedor}`} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[12px] font-bold text-gray-700">
                    {idx + 1}. {row.vendedor || 'Sin vendedor'}
                  </span>
                  <span className="shrink-0 text-[12px] font-black" style={{ color: GREEN }}>
                    {fmtMoneyCompact(row.ingresos)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 text-sm font-bold text-gray-400">Sin ventas confirmadas por vendedor.</p>
          )}
          {showEditarPool ? (
            <Link
              href={`/admin/ventas-especiales/${stats.idOferta}`}
              className="mt-5 block w-full rounded-[12px] py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-white hover:brightness-125"
              style={{ backgroundColor: NAVY }}
            >
              Editar pool
            </Link>
          ) : null}
        </div>
      </div>

      {/* Tabla de productos del pool */}
      <div className="overflow-hidden rounded-[18px] border border-gray-200/90 bg-white shadow-sm">
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
          style={{ background: `linear-gradient(90deg, ${NAVY} 0%, #143a66 100%)` }}
        >
          <p className="text-[12px] font-black uppercase tracking-wide text-white">
            VE - {stats.idOferta} {(stats.descripcion || '').toUpperCase()} | Tipo de VE: Pool
          </p>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/40">
            Softland Stock Pool
          </span>
        </div>
        {productos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12px]">
              <thead>
                <tr className="bg-[#f3efe4] text-[10px] font-black uppercase tracking-wider text-gray-600">
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-3 py-3">Código</th>
                  <th className="px-3 py-3">Descripción</th>
                  <th className="px-3 py-3 text-right text-emerald-700">Cantidad disponible</th>
                  <th className="px-3 py-3 text-right text-orange-600">Reservas</th>
                  <th className="px-3 py-3 text-right">% Part.</th>
                  <th className="px-5 py-3 text-right">Disp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productos.map((p, idx) => (
                  <tr key={`${p.tippro}-${p.codigo}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-bold text-gray-500">{p.tippro || '—'}</td>
                    <td className="px-3 py-2.5 font-black tabular-nums" style={{ color: NAVY }}>{p.codigo || '—'}</td>
                    <td className="px-3 py-2.5 font-semibold uppercase text-gray-700">{p.descripcion || '—'}</td>
                    <td className="px-3 py-2.5 text-right font-black tabular-nums" style={{ color: NAVY }}>
                      {fmtInt(p.cantidadPublicada)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums text-gray-600">
                      {fmtInt(p.cantidadReservada)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black tabular-nums text-sky-600">
                      {fmtPct(p.porcentajeParticipacion)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold tabular-nums text-gray-600">
                      {Number(p.cantidadDisponible ?? 0).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm font-bold text-gray-400">
            El pool no tiene productos cargados en USR_POOLIP.
          </p>
        )}
      </div>
    </div>
  );
}

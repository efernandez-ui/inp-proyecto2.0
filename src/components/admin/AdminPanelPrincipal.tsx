'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  ChevronDown,
  Clock,
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { OfertaEstadisticasPanel, fmtMoneyFull } from '@/components/admin/ventas-especiales/OfertaEstadisticasPanel';
import {
  getOfertaEstadisticas,
  getVentasEspeciales,
  type OfertaEstadisticas,
  type VentaEspecial,
} from '@/services/admin';

/** Verde éxito */
const GREEN = '#22c55e';
const MINT = '#2dd4a3';
/** Azul información */
const BLUE = '#2563eb';
const NAVY_CARD = '#0c2340';
const TRACK = '#e8ecf1';

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

/** Meta desde cabecera USR_POOL (listado) — disponible sin expandir. */
function ventaProgress(v: VentaEspecial): { pct: number; vendidas: number; meta: number } | null {
  const meta = v.cantidadTotal;
  const disp = v.cantidadDisponible;
  if (meta == null || disp == null || meta <= 0) return null;
  const vendidas = Math.max(0, meta - disp);
  return { vendidas, meta, pct: clampPct(Math.round((vendidas / meta) * 100)) };
}

function diasCierreFromHasta(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const hasta = new Date(iso);
  if (Number.isNaN(hasta.getTime())) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  hasta.setHours(0, 0, 0, 0);
  const dias = Math.ceil((hasta.getTime() - hoy.getTime()) / 86_400_000);
  return Math.max(0, dias);
}

function estadoActivo(estado: string | null | undefined) {
  const u = (estado || '').toUpperCase();
  if (!u) return true;
  if (u.includes('BAJA') || u.includes('FIN') || u.includes('CERR')) return false;
  return true;
}

function omsCode(nroPool: number) {
  const n = Math.abs(nroPool) % 10000;
  return `OMS-AC-${String(n).padStart(4, '0')}`;
}

function campaignTypePill(estado: string | null | undefined): string {
  const u = (estado || 'ACTIVO').toUpperCase().trim();
  if (u.includes('CONFIRM')) return 'CONFIRMADO';
  if (u.includes('LIQUI') || u.includes('FLASH')) return 'LIQUIDACIÓN FLASH';
  return u.length > 18 ? `${u.slice(0, 16)}…` : u || 'POOL VENTAS';
}

function avanceFromStats(stats: OfertaEstadisticas | undefined): {
  pct: number;
  vendidas: number;
  meta: number;
} | null {
  if (!stats) return null;
  const meta = Number(stats.cantidadPublicada ?? 0);
  const vendidas = Number(stats.cantidadVendida ?? 0);
  if (meta <= 0 && vendidas <= 0) return null;
  const pct =
    stats.coberturaPct != null
      ? clampPct(Number(stats.coberturaPct))
      : meta > 0
        ? clampPct(Math.round((vendidas / meta) * 1000) / 10)
        : 0;
  return { vendidas, meta, pct };
}

export function AdminPanelPrincipal() {
  const [items, setItems] = useState<VentaEspecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPool, setOpenPool] = useState<number | null>(null);
  const [statsByPool, setStatsByPool] = useState<Record<number, OfertaEstadisticas>>({});
  const [statsLoading, setStatsLoading] = useState<number | null>(null);
  const [statsError, setStatsError] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await getVentasEspeciales({ page: 0, size: 25, force: true });
      setItems(page.content ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (openPool == null) return;
    if (statsByPool[openPool] || statsError[openPool]) return;
    let cancelled = false;
    setStatsLoading(openPool);
    void (async () => {
      try {
        const data = await getOfertaEstadisticas(openPool);
        if (cancelled) return;
        setStatsByPool((prev) => ({ ...prev, [openPool]: data }));
      } catch (e) {
        if (cancelled) return;
        setStatsError((prev) => ({
          ...prev,
          [openPool]: e instanceof Error ? e.message : 'Error al cargar estadísticas',
        }));
      } finally {
        if (!cancelled) setStatsLoading(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openPool, statsByPool, statsError]);

  const stats = useMemo(() => {
    let unidades = 0;
    let confirmados = 0;
    let activas = 0;
    for (const v of items) {
      const t = Number(v.cantidadTotal ?? 0);
      const d = Number(v.cantidadDisponible ?? 0);
      if (t > 0) unidades += Math.max(0, t - d);
      const u = (v.estado || '').toUpperCase();
      if (u.includes('CONFIRM')) confirmados += 1;
      if (estadoActivo(v.estado)) activas += 1;
    }
    return { unidades, pools: items.length, confirmados, activas };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          className="rounded-[20px] p-5 text-white shadow-sm"
          style={{ background: `linear-gradient(145deg, ${NAVY_CARD} 0%, #143a66 100%)` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Unidades</p>
              <p className="mt-2 text-2xl font-black tracking-tight">{stats.unidades.toLocaleString('es-AR')}</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 text-sky-300">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-xs font-bold text-white/45">Vendidas (meta − disponible)</p>
        </article>

        <article
          className="rounded-[20px] p-5 text-white shadow-sm"
          style={{ background: `linear-gradient(145deg, ${NAVY_CARD} 0%, #143a66 100%)` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Pools</p>
              <p className="mt-2 text-2xl font-black tracking-tight">{stats.pools}</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 text-violet-300">
              <LayoutDashboard className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-xs font-bold text-white/45">En esta página</p>
        </article>

        <article
          className="rounded-[20px] p-5 text-white shadow-sm"
          style={{ background: `linear-gradient(145deg, ${NAVY_CARD} 0%, #143a66 100%)` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Confirmados</p>
              <p className="mt-2 text-2xl font-black tracking-tight">{stats.confirmados}</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 text-amber-300">
              <Briefcase className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-xs font-bold text-white/45">Estado CONFIRMADO</p>
        </article>

        <article
          className="rounded-[20px] p-5 text-white shadow-sm"
          style={{ background: `linear-gradient(145deg, ${NAVY_CARD} 0%, #0f3d2e 100%)` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/70">Activas</p>
              <p className="mt-2 text-2xl font-black tracking-tight">
                {stats.activas} <span className="text-sm font-bold text-white/50">/ {items.length} visibles</span>
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 text-emerald-300">
              <LayoutDashboard className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-xs font-bold text-emerald-100/70">Por texto de estado</p>
        </article>
      </div>

      <section className="overflow-hidden rounded-[20px] border border-gray-200/90 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200/80 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[13px] font-black uppercase tracking-[0.12em] text-[#001f3f]">Ventas especiales</h2>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">Rendimiento de campañas</p>
            <p className="mt-2 max-w-xl text-[10px] font-semibold leading-relaxed text-gray-400">
              Avance, mix por sucursal, ingresos, GM%, penetración y top comerciales desde Softland
              (carritos confirmados). Expandí un pool para ver el detalle por producto.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/admin/ventas-especiales/nueva"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#001f3f] shadow-sm transition hover:brightness-105"
              style={{ backgroundColor: MINT }}
            >
              <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              Nueva oferta
            </Link>
            <Link
              href="/admin/ventas-especiales?tab=gestion"
              className="inline-flex shrink-0 items-center justify-center rounded-[14px] border-2 border-[#001f3f] bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#001f3f] hover:bg-gray-50"
            >
              Gestión completa
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-gray-500">Cargando campañas…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-gray-500">
            No hay pools para mostrar.{' '}
            <Link href="/admin/ventas-especiales" className="font-black text-[#2563eb] underline">
              Ir a ventas especiales
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200/80">
            {items.map((v) => {
              const open = openPool === v.nroPool;
              const ofertaStats = statsByPool[v.nroPool];
              const headerProg = ventaProgress(v);
              const detailProg = avanceFromStats(ofertaStats) ?? headerProg;
              const headerPct = detailProg?.pct ?? headerProg?.pct ?? 0;
              const activeDot = estadoActivo(v.estado);
              const barColor = headerPct >= 70 ? GREEN : BLUE;
              const cierreDias =
                ofertaStats?.diasCierre ?? diasCierreFromHasta(v.disponibleHasta);
              const cierre = cierreDias != null ? `${cierreDias} d` : '—';

              return (
                <li key={v.nroPool} className="bg-[#f9fafb]">
                  <button
                    type="button"
                    onClick={() => setOpenPool((x) => (x === v.nroPool ? null : v.nroPool))}
                    className="flex w-full flex-col gap-5 px-5 py-5 text-left transition hover:bg-white sm:px-6 lg:flex-row lg:items-center lg:gap-5"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: activeDot ? GREEN : '#94a3b8' }}
                        aria-hidden
                      />
                      <div className="min-w-0 space-y-2">
                        <p className="text-[13px] font-black uppercase leading-snug tracking-tight text-[#001f3f]">
                          {(v.descripcion || `Pool ${v.nroPool}`).toUpperCase()}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400">{omsCode(v.nroPool)}</p>
                        <span
                          className="inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
                          style={{ backgroundColor: `${GREEN}18`, color: GREEN }}
                        >
                          {campaignTypePill(v.estado)}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-[1.15] lg:max-w-[220px]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Meta de ventas</span>
                        <span className="text-[12px] font-black text-[#001f3f]">
                          {headerProg ? `${headerPct}%` : '—'}
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: TRACK }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${headerProg ? headerPct : 0}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-8">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Ingresos</p>
                        <p className="mt-1 text-sm font-black text-[#001f3f]">
                          {ofertaStats ? fmtMoneyFull(ofertaStats.ingresos) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">GM%</p>
                        <p className="mt-1 text-sm font-black text-[#001f3f]">
                          {ofertaStats?.gmPct != null ? `${Number(ofertaStats.gmPct).toFixed(1)}%` : '—'}
                        </p>
                      </div>
                      <div className="flex items-end gap-2">
                        <Clock className="mb-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Cierre en</p>
                          <p className="mt-1 text-sm font-black text-[#001f3f]">{cierre}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end lg:min-w-[2rem]">
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </div>
                    </div>
                  </button>

                  {open ? (
                    <div className="border-t border-gray-200/80 bg-[#f3f4f6] px-4 py-5 sm:px-6">
                      {statsLoading === v.nroPool ? (
                        <p className="py-8 text-center text-sm font-bold text-gray-500">Cargando estadísticas…</p>
                      ) : statsError[v.nroPool] ? (
                        <p className="py-8 text-center text-sm font-bold text-red-600">{statsError[v.nroPool]}</p>
                      ) : (
                        ofertaStats ? (
                          <OfertaEstadisticasPanel stats={ofertaStats} showEditarPool />
                        ) : (
                          <p className="py-8 text-center text-sm font-bold text-gray-500">Sin estadísticas para este pool.</p>
                        )
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

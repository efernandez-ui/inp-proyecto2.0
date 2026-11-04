'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  confirmarVentaEspecial,
  getVentasEspeciales,
  type PageVentasEspeciales,
  type VentaEspecial,
} from '@/services/admin';
import { toast } from 'react-toastify';
import { RotateCcw, Search } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

const filterInputClass =
  'box-border h-9 w-full rounded-lg border-2 border-gray-300 bg-white pl-8 pr-2 text-xs font-bold leading-none text-black placeholder:text-gray-500';

const paginationBtnClass =
  'text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 border-gray-400 bg-white text-[#001f3f] shadow-sm hover:bg-gray-50 hover:border-[#001f3f] disabled:opacity-40 disabled:pointer-events-none disabled:border-gray-300 disabled:bg-gray-50';

const btnActualizarClass =
  'text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border-2 border-slate-800 bg-slate-600 text-white shadow-sm hover:bg-slate-700 hover:border-slate-900 shrink-0';

const btnIconBase =
  'box-border h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border-2 bg-white text-black shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none';

const btnBuscarIconClass = `${btnIconBase} border-black`;

const btnResetIconClass = `${btnIconBase} border-gray-300`;

export function AdminVentasEspecialesSection() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageData, setPageData] = useState<PageVentasEspeciales | null>(null);
  const [loading, setLoading] = useState(true);

  const [draftFechaDesde, setDraftFechaDesde] = useState('');
  const [draftFechaHasta, setDraftFechaHasta] = useState('');
  const [draftEstado, setDraftEstado] = useState('');
  const [appliedFechaDesde, setAppliedFechaDesde] = useState('');
  const [appliedFechaHasta, setAppliedFechaHasta] = useState('');
  const [appliedEstado, setAppliedEstado] = useState('');

  const fetchPage = useCallback(
    async (opts?: { force?: boolean }) => {
      setLoading(true);
      try {
        const data = await getVentasEspeciales({
          force: opts?.force,
          page,
          size: pageSize,
          fechaDesde: appliedFechaDesde || undefined,
          fechaHasta: appliedFechaHasta || undefined,
          estado: appliedEstado || undefined,
        });
        setPageData(data);
      } catch {
        toast.error('No se pudieron cargar las ventas especiales');
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, appliedFechaDesde, appliedFechaHasta, appliedEstado]
  );

  useEffect(() => {
    void fetchPage({ force: false });
  }, [fetchPage]);

  const items: VentaEspecial[] = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;
  const isFirst = pageData?.first ?? true;
  const isLast = pageData?.last ?? true;

  const aplicarFiltros = () => {
    setAppliedFechaDesde(draftFechaDesde.trim());
    setAppliedFechaHasta(draftFechaHasta.trim());
    setAppliedEstado(draftEstado.trim());
    setPage(0);
  };

  const limpiarFiltros = () => {
    setDraftFechaDesde('');
    setDraftFechaHasta('');
    setAppliedFechaDesde('');
    setAppliedFechaHasta('');
    setDraftEstado('');
    setAppliedEstado('');
    setPage(0);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => void fetchPage({ force: true })} className={btnActualizarClass}>
          Actualizar
        </button>
        <Link
          href="/admin/ventas-especiales/nueva"
          prefetch
          className="text-[11px] font-black uppercase tracking-widest rounded-xl border-2 border-[#001f3f] bg-[#001f3f] px-4 py-2 text-white shadow-sm hover:bg-[#002b52]"
        >
          Nueva estrategia
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Fecha desde</label>
          <div className="relative min-w-[150px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" aria-hidden />
            <input
              type="date"
              value={draftFechaDesde}
              onChange={(e) => setDraftFechaDesde(e.target.value)}
              className={filterInputClass}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Fecha hasta</label>
          <div className="relative min-w-[150px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" aria-hidden />
            <input
              type="date"
              value={draftFechaHasta}
              onChange={(e) => setDraftFechaHasta(e.target.value)}
              className={filterInputClass}
            />
          </div>
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Estado contiene</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" aria-hidden />
            <input
              type="text"
              value={draftEstado}
              onChange={(e) => setDraftEstado(e.target.value)}
              placeholder="Activo, confirmado…"
              className={filterInputClass}
            />
          </div>
        </div>
        <button type="button" onClick={aplicarFiltros} className={btnBuscarIconClass} aria-label="Buscar / aplicar filtros" title="Buscar / aplicar filtros">
          <Search className="h-4 w-4" strokeWidth={2} />
        </button>
        <button type="button" onClick={limpiarFiltros} className={btnResetIconClass} aria-label="Restablecer filtros" title="Restablecer filtros">
          <RotateCcw className="h-4 w-4" strokeWidth={2} />
        </button>
        <div className="ml-auto flex items-center gap-2 text-[11px] font-bold text-gray-600">
          <span className="uppercase tracking-widest text-[10px] font-black text-gray-500">Por página</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(0);
              setPageSize(Number(e.target.value));
            }}
            className="box-border h-9 rounded-lg border-2 border-gray-300 bg-white px-2 text-xs font-black leading-none text-black"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {totalElements > 0 && pageData != null && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-3">
          <button
            type="button"
            disabled={loading || isFirst}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className={paginationBtnClass}
          >
            Anterior
          </button>
          <span className="text-xs font-bold text-gray-600">
            Página {page + 1} / {totalPages}
            {!loading && (
              <>
                {' '}
                · <span className="text-[#001f3f]">{totalElements}</span> registros
              </>
            )}
          </span>
          <button
            type="button"
            disabled={loading || isLast}
            onClick={() => setPage((p) => p + 1)}
            className={paginationBtnClass}
          >
            Siguiente
          </button>
        </div>
      )}

      <div className="mt-4 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <div className="col-span-2">NrPool</div>
          <div className="col-span-3">Descripción</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Fecha alta</div>
          <div className="col-span-3 text-right">Acciones</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm font-bold text-gray-500">Cargando…</div>
        ) : totalElements === 0 ? (
          <div className="p-6 text-sm font-bold text-gray-500">Sin datos con los filtros actuales.</div>
        ) : (
          items.map((v) => (
            <div
              key={v.nroPool}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b last:border-b-0 items-center"
            >
              <div className="col-span-2 text-sm font-black text-[#001f3f]">{v.nroPool}</div>
              <div className="col-span-3 text-sm font-bold text-gray-700 truncate">{v.descripcion || '-'}</div>
              <div className="col-span-2 text-xs font-black uppercase tracking-wider text-gray-600">
                {(v.estado || '-').toString()}
              </div>
              <div className="col-span-2 text-xs font-bold text-gray-600">
                {v.fecalt ? new Date(v.fecalt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
              </div>
              <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                <Link
                  href={`/admin/ventas-especiales/${v.nroPool}`}
                  prefetch
                  className="text-[11px] font-black uppercase tracking-widest bg-gray-100 text-[#001f3f] px-3 py-1.5 rounded-lg hover:bg-gray-200 border border-gray-300"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  className="text-[11px] font-black uppercase tracking-widest bg-[#0e8c85] text-white px-3 py-1.5 rounded-lg hover:brightness-110 disabled:opacity-50 border-2 border-[#0b6f6a]"
                  disabled={(v.estado || '').toUpperCase() === 'CONFIRMADO'}
                  onClick={async () => {
                    try {
                      const updated = await confirmarVentaEspecial(v.nroPool);
                      setPageData((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          content: prev.content.map((x) => (x.nroPool === updated.nroPool ? updated : x)),
                        };
                      });
                      toast.success('Confirmado');
                    } catch {
                      toast.error('No se pudo confirmar');
                    }
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

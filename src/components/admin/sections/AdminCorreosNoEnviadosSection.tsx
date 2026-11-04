'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getCorreosNoEnviados,
  reenviarCorreo,
  reenviarTodoCorreos,
  type CorreoElectronicoTv,
  type PageCorreosNoEnviados,
} from '@/services/admin';
import { toast } from 'react-toastify';
import { RotateCcw, Search } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/** Misma altura que los botones de acción del filtro (`h-9`). */
const filterInputClass =
  'box-border h-9 w-full rounded-lg border-2 border-gray-300 bg-white pl-8 pr-2 text-xs font-bold leading-none text-black placeholder:text-gray-500';

const paginationBtnClass =
  'text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 border-gray-400 bg-white text-[#001f3f] shadow-sm hover:bg-gray-50 hover:border-[#001f3f] disabled:opacity-40 disabled:pointer-events-none disabled:border-gray-300 disabled:bg-gray-50';

const btnActualizarClass =
  'text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border-2 border-slate-800 bg-slate-600 text-white shadow-sm hover:bg-slate-700 hover:border-slate-900';

const btnIconBase =
  'box-border h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border-2 bg-white text-black shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none';

const btnBuscarIconClass = `${btnIconBase} border-black`;

const btnResetIconClass = `${btnIconBase} border-gray-300`;

export function AdminCorreosNoEnviadosSection() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageData, setPageData] = useState<PageCorreosNoEnviados | null>(null);
  const [loading, setLoading] = useState(true);

  const [draftFechaDesde, setDraftFechaDesde] = useState('');
  const [draftFechaHasta, setDraftFechaHasta] = useState('');
  const [draftAsunto, setDraftAsunto] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [appliedFechaDesde, setAppliedFechaDesde] = useState('');
  const [appliedFechaHasta, setAppliedFechaHasta] = useState('');
  const [appliedAsunto, setAppliedAsunto] = useState('');
  const [appliedEmail, setAppliedEmail] = useState('');

  const fetchPage = useCallback(
    async (opts?: { force?: boolean }) => {
      setLoading(true);
      try {
        const data = await getCorreosNoEnviados({
          force: opts?.force,
          page,
          size: pageSize,
          fechaDesde: appliedFechaDesde || undefined,
          fechaHasta: appliedFechaHasta || undefined,
          asunto: appliedAsunto || undefined,
          email: appliedEmail || undefined,
        });
        setPageData(data);
      } catch {
        toast.error('No se pudieron cargar los correos no enviados');
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, appliedFechaDesde, appliedFechaHasta, appliedAsunto, appliedEmail]
  );

  useEffect(() => {
    void fetchPage({ force: false });
  }, [fetchPage]);

  const items: CorreoElectronicoTv[] = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;
  const isFirst = pageData?.first ?? true;
  const isLast = pageData?.last ?? true;

  const aplicarFiltros = () => {
    setAppliedFechaDesde(draftFechaDesde.trim());
    setAppliedFechaHasta(draftFechaHasta.trim());
    setAppliedAsunto(draftAsunto.trim());
    setAppliedEmail(draftEmail.trim());
    setPage(0);
  };

  const limpiarFiltros = () => {
    setDraftFechaDesde('');
    setDraftFechaHasta('');
    setDraftAsunto('');
    setDraftEmail('');
    setAppliedFechaDesde('');
    setAppliedFechaHasta('');
    setAppliedAsunto('');
    setAppliedEmail('');
    setPage(0);
  };

  const reenviar = async (nroEnvio: number) => {
    try {
      await reenviarCorreo(nroEnvio);
      toast.success('Enviado');
      await fetchPage({ force: true });
    } catch {
      toast.error('No se pudo enviar');
    }
  };

  const reenviarTodo = async () => {
    try {
      const data = await reenviarTodoCorreos();
      toast.success(`Enviados: ${data.enviados} / Fallidos: ${data.fallidos}`);
      const prevPage = page;
      setPage(0);
      if (prevPage === 0) {
        await fetchPage({ force: true });
      }
    } catch {
      toast.error('No se pudo enviar todo');
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-600 font-medium">
        Tabla <code className="text-xs">USR_TVCORE</code> (pendientes <code className="text-xs">enviado = N</code>). Paginación y filtros:{' '}
        <code className="text-xs">GET /api/admin/correo-no-enviados?…</code>
      </p>

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
        <div className="flex min-w-[140px] flex-1 flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Asunto contiene</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" aria-hidden />
            <input
              type="text"
              value={draftAsunto}
              onChange={(e) => setDraftAsunto(e.target.value)}
              placeholder="Texto…"
              className={filterInputClass}
            />
          </div>
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email / destinatarios</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" aria-hidden />
            <input
              type="text"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder="correo@…"
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
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void fetchPage({ force: true })} className={btnActualizarClass}>
          Actualizar
        </button>
        <button
          type="button"
          onClick={() => void reenviarTodo()}
          className="text-[11px] font-black uppercase tracking-widest bg-[#0e8c85] text-white hover:brightness-110 px-3 py-2 rounded-xl border-2 border-[#0b6f6a]"
        >
          Enviar todo
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
                · <span className="text-[#001f3f]">{totalElements}</span> coincidencias
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
          <div className="col-span-2">Nro</div>
          <div className="col-span-2">Fecha</div>
          <div className="col-span-4">Asunto</div>
          <div className="col-span-3">Destinatarios</div>
          <div className="col-span-1 text-right">Reint.</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm font-bold text-gray-500">Cargando…</div>
        ) : totalElements === 0 ? (
          <div className="p-6 text-sm font-bold text-gray-500">Sin pendientes con los filtros actuales.</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm font-bold text-gray-500">Sin filas en esta página.</div>
        ) : (
          items.map((o) => (
            <div key={o.nroEnvio} className="grid grid-cols-12 gap-2 px-4 py-3 border-b last:border-b-0">
              <div className="col-span-2 text-sm font-black text-[#001f3f]">{o.nroEnvio}</div>
              <div className="col-span-2 text-xs font-bold text-gray-600">
                {o.fechaEnvio ? new Date(o.fechaEnvio).toLocaleDateString('es-AR') : '-'}
              </div>
              <div className="col-span-4 text-xs font-bold text-gray-700 truncate">{o.asunto || '-'}</div>
              <div className="col-span-3 text-[11px] text-gray-600 truncate">{o.destinatarios || '-'}</div>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => void reenviar(o.nroEnvio)}
                  className="text-[10px] font-black uppercase tracking-widest bg-[#001f3f] text-white px-2 py-1 rounded-lg hover:brightness-110 border border-[#001f3f]"
                >
                  →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

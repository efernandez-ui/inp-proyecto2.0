'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, FileSpreadsheet, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import type { MovimientoCuenta } from '@/services/cuentaCorriente';
import {
  downloadXlsx,
  EXPORT_PAGE_SIZE,
  fetchMovimientos,
  formatCurrency,
  formatDate,
  historialMinInputDate,
  inputDateToApiDate,
  isHistorialDesdeValido,
  MOVIMIENTOS_PAGE_SIZE,
  toInputDate,
} from '@/services/cuentaCorriente';

interface Props {
  token: string;
  nrocta?: string;
}

const dateInputClass =
  'box-border h-11 w-full min-w-[11.5rem] cursor-pointer rounded-xl border-2 border-gray-300 bg-white pl-10 pr-3 text-sm font-semibold text-[#001f3f] shadow-sm transition focus:border-[#0e8c85] focus:outline-none focus:ring-2 focus:ring-[#0e8c85]/25 [color-scheme:light]';

const searchInputClass =
  'box-border h-11 w-full rounded-xl border-2 border-gray-300 bg-white pl-10 pr-4 text-sm font-semibold uppercase tracking-wide text-[#001f3f] shadow-sm placeholder:normal-case placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:border-[#0e8c85] focus:outline-none focus:ring-2 focus:ring-[#0e8c85]/25';

const paginationBtnClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#001f3f] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';

function defaultDesde(): string {
  const min = historialMinInputDate();
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  const yearAgo = toInputDate(d);
  return yearAgo < min ? min : yearAgo;
}

function formatComprobante(item: MovimientoCuenta): string {
  if (item.tipo === 'SALDO_ANTERIOR') return 'Saldo anterior';
  const cod = (item.codComprobante ?? '').trim();
  const suc = (item.sucursal ?? '').trim();
  const nro = String(item.numero ?? 0).padStart(8, '0');
  if (cod && suc) return `${cod} ${suc}-${nro}`;
  if (cod) return `${cod}-${nro}`;
  return nro;
}

export default function HistorialTab({ token, nrocta }: Props) {
  const today = new Date();
  const minHistorial = historialMinInputDate();
  const abortRef = useRef<AbortController | null>(null);

  const [search, setSearch] = useState('');
  const [fDesde, setFDesde] = useState(defaultDesde);
  const [fHasta, setFHasta] = useState(toInputDate(today));
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<MovimientoCuenta[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadPage = useCallback(async (targetPage: number, desde: string, hasta: string, documento?: string) => {
    if (!desde || !hasta) {
      toast.error('Seleccioná fecha desde y hasta');
      return;
    }
    if (hasta < desde) {
      toast.error('La fecha hasta debe ser posterior o igual a la fecha desde');
      return;
    }
    if (!isHistorialDesdeValido(desde)) {
      toast.error(`El historial solo permite consultar los últimos 2 años (desde ${inputDateToApiDate(minHistorial)})`);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const data = await fetchMovimientos(token, {
        nrocta,
        soloPendientes: false,
        fdesde: inputDateToApiDate(desde),
        fhasta: inputDateToApiDate(hasta),
        page: targetPage,
        size: MOVIMIENTOS_PAGE_SIZE,
        documento: documento?.trim() || undefined,
      });
      if (controller.signal.aborted) return;

      const rows = Array.isArray(data.content) ? data.content : [];
      setItems(rows);
      setTotalElements(data.totalElements ?? rows.length);
      setTotalPages(data.totalPages ?? 0);
      setIsFirst(data.first ?? targetPage === 0);
      setIsLast(data.last ?? false);
      setPage(targetPage);
      setLoaded(true);
    } catch (e: unknown) {
      if (controller.signal.aborted) return;
      setItems([]);
      setTotalElements(0);
      setTotalPages(0);
      setLoaded(true);
      toast.error(e instanceof Error ? e.message : 'Error al consultar historial');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [token, nrocta, minHistorial]);

  useEffect(() => {
    void loadPage(0, fDesde, fHasta, search);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial al abrir tab
  }, [token, nrocta]);

  const consultar = () => void loadPage(0, fDesde, fHasta, search);

  const clearFilters = () => {
    const desde = defaultDesde();
    const hasta = toInputDate(new Date());
    setSearch('');
    setFDesde(desde);
    setFHasta(hasta);
    void loadPage(0, desde, hasta, '');
  };

  const exportExcel = async () => {
    if (exporting) return;
    if (!fDesde || !fHasta) {
      toast.error('Seleccioná fecha desde y hasta');
      return;
    }
    if (fHasta < fDesde) {
      toast.error('La fecha hasta debe ser posterior o igual a la fecha desde');
      return;
    }
    if (!isHistorialDesdeValido(fDesde)) {
      toast.error(`El historial solo permite consultar los últimos 2 años (desde ${inputDateToApiDate(minHistorial)})`);
      return;
    }

    setExporting(true);
    try {
      const data = await fetchMovimientos(token, {
        nrocta,
        soloPendientes: false,
        fdesde: inputDateToApiDate(fDesde),
        fhasta: inputDateToApiDate(fHasta),
        page: 0,
        size: EXPORT_PAGE_SIZE,
        documento: search.trim() || undefined,
      });
      const all = Array.isArray(data.content) ? data.content : [];
      if (all.length === 0) {
        toast.error('No hay movimientos para exportar');
        return;
      }
      downloadXlsx(
        'historial-cuenta-corriente.xlsx',
        ['Fecha', 'Comprobante', 'Debe', 'Haber', 'Saldo'],
        all.map((i) => [
          formatDate(i.fecha),
          formatComprobante(i),
          i.debe ?? 0,
          i.haber ?? 0,
          i.saldo ?? 0,
        ]),
        'Historial',
      );
      if ((data.totalElements ?? 0) > all.length) {
        toast.info(`Se exportaron ${all.length} de ${data.totalElements} registros (límite ${EXPORT_PAGE_SIZE})`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al exportar Excel');
    } finally {
      setExporting(false);
    }
  };

  const showPagination = loaded && totalPages > 1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          Período de consulta
        </p>

        <div className="mt-3">
          {/* Filtro por documento deshabilitado: el buscador vive en Descarga comprobantes
          <label
            htmlFor="historial-search"
            className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-600"
          >
            Documento
          </label>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0e8c85]" />
            <input
              id="historial-search"
              type="text"
              placeholder="Buscar por Nº de documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultar()}
              className={searchInputClass}
            />
          </div>
          */}
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-[11.5rem] flex-1">
              <label
                htmlFor="historial-fdesde"
                className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-600"
              >
                Desde
              </label>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0e8c85]"
                  aria-hidden
                />
                <input
                  id="historial-fdesde"
                  type="date"
                  value={fDesde}
                  min={minHistorial}
                  max={fHasta || undefined}
                  onChange={(e) => setFDesde(e.target.value)}
                  className={dateInputClass}
                />
              </div>
            </div>
            <div className="hidden pb-3 text-sm font-bold text-gray-400 sm:block" aria-hidden>
              —
            </div>
            <div className="min-w-[11.5rem] flex-1">
              <label
                htmlFor="historial-fhasta"
                className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-600"
              >
                Hasta
              </label>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0e8c85]"
                  aria-hidden
                />
                <input
                  id="historial-fhasta"
                  type="date"
                  value={fHasta}
                  min={fDesde || undefined}
                  max={toInputDate(today)}
                  onChange={(e) => setFHasta(e.target.value)}
                  className={dateInputClass}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={consultar}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#001f3f] px-6 text-xs font-bold uppercase tracking-wide text-white shadow-md hover:bg-[#002a55] disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => void exportExcel()}
            disabled={exporting || !loaded || totalElements === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            {exporting ? 'Exportando...' : 'Excel'}
          </button>
        </div>
        <p className="mt-3 text-[11px] font-medium text-gray-500">
          Podés consultar movimientos de los últimos 2 años (desde {inputDateToApiDate(minHistorial)}).
          {' '}{MOVIMIENTOS_PAGE_SIZE} registros por página.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm text-[#001f3f]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Fecha</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Comprobante</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Debe</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Haber</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {loading && items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Sin movimientos en el período seleccionado. Probá ampliar el rango de fechas.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr
                  key={`hist-${page}-${idx}-${item.id ?? item.tipo}`}
                  className={item.tipo === 'SALDO_ANTERIOR' ? 'bg-gray-50 font-semibold' : ''}
                >
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.fecha)}</td>
                  <td className="px-4 py-3">
                    {formatComprobante(item)}
                    {item.comprobante && item.tipo !== 'SALDO_ANTERIOR' && (
                      <div className="text-[11px] text-gray-500">{item.comprobante}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(item.debe)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(item.haber)}</td>
                  <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{formatCurrency(item.saldo)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
          <button
            type="button"
            disabled={loading || isFirst}
            onClick={() => void loadPage(Math.max(0, page - 1), fDesde, fHasta, search)}
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
            onClick={() => void loadPage(page + 1, fDesde, fHasta, search)}
            className={paginationBtnClass}
          >
            Siguiente
          </button>
        </div>
      )}

      {loaded && !loading && totalElements > 0 && (
        <p className="text-center text-xs font-bold text-gray-500">
          Mostrando {items.length} de {totalElements} registros
          {totalPages > 1 ? ` · página ${page + 1}/${totalPages}` : ''}
        </p>
      )}
    </div>
  );
}

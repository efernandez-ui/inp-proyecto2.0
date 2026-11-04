'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  CREDITOS_PAGE_SIZE,
  downloadXlsx,
  EXPORT_PAGE_SIZE,
  fetchCreditosPendientes,
  fetchMovimientos,
  formatCurrency,
  formatDate,
  MOVIMIENTOS_PAGE_SIZE,
  type MovimientoCuenta,
  type MovimientoPendiente,
  type PaginatedResponse,
} from '@/services/cuentaCorriente';

interface Props {
  token: string;
  nrocta?: string;
  refreshKey?: number;
}

const paginationBtnClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#001f3f] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';

const sectionTitleClass =
  'text-[11px] font-black uppercase tracking-[0.15em] text-[#001f3f]';

function formatDocumento(
  item: Pick<MovimientoCuenta | MovimientoPendiente, 'codComprobante' | 'numero'>,
): string {
  const cod = (item.codComprobante ?? '').trim();
  const nro = String(item.numero ?? 0).padStart(8, '0');
  return cod ? `${cod}-${nro}` : nro;
}

export default function DocumentosPendientesTab({ token, nrocta, refreshKey = 0 }: Props) {
  const [page, setPage] = useState(0);
  const [creditosPage, setCreditosPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingCreditos, setLoadingCreditos] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingCreditos, setExportingCreditos] = useState(false);
  const [pageData, setPageData] = useState<PaginatedResponse<MovimientoCuenta> | null>(null);
  const [creditos, setCreditos] = useState<MovimientoPendiente[]>([]);
  const requestIdRef = useRef(0);

  const loadDebitos = useCallback(async (targetPage: number) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await fetchMovimientos(token, {
        nrocta,
        soloPendientes: true,
        page: targetPage,
        size: MOVIMIENTOS_PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;
      setPageData(data);
      setPage(targetPage);
    } catch (e: unknown) {
      if (requestId !== requestIdRef.current) return;
      toast.error(e instanceof Error ? e.message : 'Error al cargar compras pendientes de pago');
      setPageData(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [token, nrocta]);

  const loadCreditos = useCallback(async () => {
    setLoadingCreditos(true);
    try {
      const data = await fetchCreditosPendientes(token, nrocta);
      setCreditos(data);
      setCreditosPage(0);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar pagos pendientes de aplicar');
      setCreditos([]);
    } finally {
      setLoadingCreditos(false);
    }
  }, [token, nrocta]);

  useEffect(() => {
    void loadDebitos(0);
  }, [loadDebitos, refreshKey]);

  useEffect(() => {
    void loadCreditos();
  }, [loadCreditos, refreshKey]);

  const items = (pageData?.content ?? []).filter((i) => i.tipo === 'PENDIENTE');
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;
  const showDebitosPagination = !loading && totalElements > 0;

  const creditosTotalPages = Math.max(1, Math.ceil(creditos.length / CREDITOS_PAGE_SIZE));
  const creditosFrom = creditosPage * CREDITOS_PAGE_SIZE;
  const creditosSlice = creditos.slice(creditosFrom, creditosFrom + CREDITOS_PAGE_SIZE);
  const showCreditosPagination = !loadingCreditos && creditos.length > 0;

  const exportDebitosExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await fetchMovimientos(token, {
        nrocta,
        soloPendientes: true,
        page: 0,
        size: EXPORT_PAGE_SIZE,
      });
      const all = (data.content ?? []).filter((i) => i.tipo === 'PENDIENTE');
      if (all.length === 0) {
        toast.error('No hay documentos para exportar');
        return;
      }
      downloadXlsx(
        'compras-pendientes-pago.xlsx',
        ['Documento', 'Vencimiento', 'Estado', 'Monto'],
        all.map((i) => [
          formatDocumento(i),
          formatDate(i.vencimiento),
          i.estado === 'VENCIDO' ? 'Vencido' : 'Por vencer',
          i.pendiente ?? 0,
        ]),
        'Compras pendientes',
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

  const exportCreditosExcel = () => {
    if (exportingCreditos) return;
    if (creditos.length === 0) {
      toast.error('No hay créditos para exportar');
      return;
    }
    setExportingCreditos(true);
    try {
      downloadXlsx(
        'pagos-pendientes-aplicar.xlsx',
        ['Documento', 'Vencimiento', 'Pendiente'],
        creditos.map((i) => [
          formatDocumento(i),
          formatDate(i.vencimiento),
          i.pendiente ?? 0,
        ]),
        'Pagos pendientes',
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al exportar Excel');
    } finally {
      setExportingCreditos(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros por fecha deshabilitados — export Excel vive en "Sus compras pendientes de pago"
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          Filtros de consulta (compras pendientes de pago)
        </p>

        <div className="mt-3">
          <label
            htmlFor="pend-search"
            className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-600"
          >
            Documento
          </label>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0e8c85]" />
            <input
              id="pend-search"
              type="text"
              placeholder="Buscar por Nº de documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
              className={searchInputClass}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-[11.5rem] flex-1">
              <label
                htmlFor="pend-fdesde"
                className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-600"
              >
                Vencimiento desde
              </label>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0e8c85]"
                  aria-hidden
                />
                <input
                  id="pend-fdesde"
                  type="date"
                  value={fDesde}
                  max={fHasta || todayStr}
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
                htmlFor="pend-fhasta"
                className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-600"
              >
                Vencimiento hasta
              </label>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0e8c85]"
                  aria-hidden
                />
                <input
                  id="pend-fhasta"
                  type="date"
                  value={fHasta}
                  min={fDesde || undefined}
                  max={todayStr}
                  onChange={(e) => setFHasta(e.target.value)}
                  className={dateInputClass}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={applyFilter}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#001f3f] px-6 text-xs font-bold uppercase tracking-wide text-white shadow-md hover:bg-[#002a55] disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Filtrando...' : 'Filtrar'}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Limpiar
          </button>
        </div>
        <p className="mt-3 text-[11px] font-medium text-gray-500">
          Las fechas se aplican al apretar Filtrar. {MOVIMIENTOS_PAGE_SIZE} registros por página en compras pendientes.
        </p>
      </div>
      */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Columna izquierda: compras pendientes de pago */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={sectionTitleClass}>Sus compras pendientes de pago</h3>
            <button
              type="button"
              onClick={() => void exportDebitosExcel()}
              disabled={exporting || totalElements === 0}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              {exporting ? 'Exportando...' : 'Excel'}
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-[#001f3f]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Documento</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Vencimiento</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No se han encontrado débitos pendientes</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={item.id ?? `pend-${page}-${idx}`} className={item.estado === 'VENCIDO' ? 'bg-red-50/40' : ''}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#001f3f]">{formatDocumento(item)}</div>
                      {item.comprobante && (
                        <div className="text-[11px] text-gray-500">{item.comprobante}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={item.estado === 'VENCIDO' ? 'font-semibold text-red-600' : 'text-gray-800'}>
                        {formatDate(item.vencimiento)}
                      </div>
                      {item.estado === 'VENCIDO' && (
                        <div className="text-[11px] font-bold text-red-500">
                          {Math.abs(item.diasAlVencimiento ?? 0)} DÍAS VENCIDOS
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white ${item.estado === 'VENCIDO' ? 'bg-red-500' : 'bg-amber-500'}`}>
                        {item.estado === 'VENCIDO' ? 'Vencido' : 'Por vencer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#001f3f]">
                      {formatCurrency(item.pendiente)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showDebitosPagination && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <button
                type="button"
                disabled={loading || pageData?.first}
                onClick={() => void loadDebitos(Math.max(0, page - 1))}
                className={paginationBtnClass}
              >
                Anterior
              </button>
              <span className="text-xs font-bold text-gray-600">
                Página {totalPages === 0 ? 0 : page + 1} / {totalPages}
                {!loading && (
                  <>
                    {' '}
                    · <span className="text-[#001f3f]">{totalElements}</span> registros
                  </>
                )}
              </span>
              <button
                type="button"
                disabled={loading || pageData?.last}
                onClick={() => void loadDebitos(page + 1)}
                className={paginationBtnClass}
              >
                Siguiente
              </button>
            </div>
          )}

          {!loading && totalElements > 0 && (
            <p className="text-center text-xs font-bold text-gray-500">
              Mostrando {items.length} de {totalElements} registros
              {totalPages > 1 ? ` · página ${page + 1}/${totalPages}` : ''}
            </p>
          )}
        </div>

        {/* Columna derecha: pagos pendientes de aplicar */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={sectionTitleClass}>Sus pagos pendientes de aplicar</h3>
            <button
              type="button"
              onClick={exportCreditosExcel}
              disabled={exportingCreditos || creditos.length === 0}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              {exportingCreditos ? 'Exportando...' : 'Excel'}
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-[#001f3f]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Documento</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Vencimiento</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {loadingCreditos ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
                ) : creditosSlice.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No se han encontrado créditos pendientes</td></tr>
                ) : creditosSlice.map((item, idx) => (
                  <tr key={item.id ?? `cred-${creditosPage}-${idx}`}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#001f3f]">{formatDocumento(item)}</div>
                      {item.comprobante && (
                        <div className="text-[11px] text-gray-500">{item.comprobante}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {formatDate(item.vencimiento)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#001f3f]">
                      {formatCurrency(item.pendiente)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showCreditosPagination && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <button
                type="button"
                disabled={loadingCreditos || creditosPage <= 0}
                onClick={() => setCreditosPage((p) => Math.max(0, p - 1))}
                className={paginationBtnClass}
              >
                Anterior
              </button>
              <span className="text-xs font-bold text-gray-600">
                Página {creditosPage + 1} / {creditosTotalPages}
                {!loadingCreditos && (
                  <>
                    {' '}
                    · <span className="text-[#001f3f]">{creditos.length}</span> registros
                  </>
                )}
              </span>
              <button
                type="button"
                disabled={loadingCreditos || creditosPage >= creditosTotalPages - 1}
                onClick={() => setCreditosPage((p) => p + 1)}
                className={paginationBtnClass}
              >
                Siguiente
              </button>
            </div>
          )}

          {!loadingCreditos && creditos.length > 0 && (
            <p className="text-center text-xs font-bold text-gray-500">
              Mostrando {creditosSlice.length} de {creditos.length} registros
              {showCreditosPagination ? ` · página ${creditosPage + 1}/${creditosTotalPages}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

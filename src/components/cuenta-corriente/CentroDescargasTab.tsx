'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Info, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import type { DescargaDocumento } from '@/services/cuentaCorriente';
import {
  fetchDescargas,
  formatDate,
  MOVIMIENTOS_PAGE_SIZE,
  resolveDescargaPdfUrl,
} from '@/services/cuentaCorriente';

interface Props {
  token: string;
  nrocta?: string;
}

const PAGE_SIZE = MOVIMIENTOS_PAGE_SIZE;

const paginationBtnClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#001f3f] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';

const searchInputClass =
  'h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#001f3f] outline-none ring-[#0e8c85]/30 placeholder:font-medium placeholder:text-gray-400 focus:border-[#0e8c85] focus:ring-2';

export default function CentroDescargasTab({ token, nrocta }: Props) {
  const [items, setItems] = useState<DescargaDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(true);
  const [unavailableUrls, setUnavailableUrls] = useState<Set<string>>(new Set());
  const [checkingPage, setCheckingPage] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const loadPage = useCallback(
    async (targetPage: number, documento?: string) => {
      setLoading(true);
      try {
        const data = await fetchDescargas(token, {
          nrocta,
          page: targetPage,
          size: PAGE_SIZE,
          documento: documento?.trim() || undefined,
        });
        const rows = Array.isArray(data.content) ? data.content : [];
        setItems(rows);
        setTotalElements(data.totalElements ?? rows.length);
        setTotalPages(data.totalPages ?? 0);
        setIsFirst(data.first ?? targetPage === 0);
        setIsLast(data.last ?? true);
        setPage(targetPage);
        setUnavailableUrls(new Set());
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error al cargar descargas');
        setItems([]);
        setTotalElements(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    [token, nrocta],
  );

  useEffect(() => {
    void loadPage(0, appliedSearch);
  }, [loadPage, appliedSearch]);

  // HEAD solo de los comprobantes de la página actual (paginada en backend)
  useEffect(() => {
    if (loading || items.length === 0) {
      setCheckingPage(false);
      return;
    }

    const urls = items
      .map((item) => resolveDescargaPdfUrl(item))
      .filter((url): url is string => Boolean(url));

    if (urls.length === 0) {
      setCheckingPage(false);
      return;
    }

    const controller = new AbortController();
    setCheckingPage(true);

    (async () => {
      const failed = new Set<string>();
      await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
            if (!res.ok) failed.add(url);
          } catch {
            if (!controller.signal.aborted) failed.add(url);
          }
        }),
      );
      if (controller.signal.aborted) return;
      setUnavailableUrls(failed);
      setCheckingPage(false);
    })();

    return () => controller.abort();
  }, [loading, items]);

  const applySearch = () => setAppliedSearch(search.trim());

  const clearSearch = () => {
    setSearch('');
    setAppliedSearch('');
  };

  const showPagination = totalPages > 1;

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
        <span>
          <strong className="font-bold">Atención:</strong> están disponibles las descargas de facturas
          realizadas a partir del 26/02/2025.
        </span>
      </p>

      <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          Buscar comprobante
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="descargas-search"
              className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-600"
            >
              Comprobante
            </label>
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0e8c85]" />
              <input
                id="descargas-search"
                type="text"
                placeholder="Buscar por Nº de comprobante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                className={searchInputClass}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={applySearch}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#001f3f] px-6 text-xs font-bold uppercase tracking-wide text-white shadow-md hover:bg-[#002a55] disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            type="button"
            onClick={clearSearch}
            disabled={loading || (!search && !appliedSearch)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm text-[#001f3f]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Documento</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Fecha</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">Ítems</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No hay comprobantes disponibles</td></tr>
            ) : items.map((item) => {
              const pdfUrl = resolveDescargaPdfUrl(item);
              const pdfUnavailable = pdfUrl ? unavailableUrls.has(pdfUrl) : false;

              return (
                <tr key={`${item.codfor}-${item.nrofor}-${item.fchmov}`}>
                  <td className="px-4 py-3 font-bold text-[#001f3f]">{item.documentoLabel}</td>
                  <td className="px-4 py-3">{formatDate(item.fchmov)}</td>
                  <td className="px-4 py-3 text-center">{item.cantidadItems}</td>
                  <td className="px-4 py-3 text-right">
                    {pdfUrl && !pdfUnavailable ? (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Descargar comprobante"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#001f3f] hover:bg-gray-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    ) : pdfUrl && pdfUnavailable ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-gray-400"
                        title="No está disponible la descarga"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        No disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <FileText className="h-3.5 w-3.5" />
                        Sin archivo
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {checkingPage && !loading && items.length > 0 && (
        <p className="text-center text-xs font-medium text-gray-500">
          Verificando disponibilidad de PDFs de esta página...
        </p>
      )}

      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
          <button
            type="button"
            disabled={loading || isFirst}
            onClick={() => void loadPage(Math.max(0, page - 1), appliedSearch)}
            className={paginationBtnClass}
          >
            Anterior
          </button>
          <span className="text-xs font-bold text-gray-600">
            Página {page + 1} / {totalPages}
            {' '}
            · <span className="text-[#001f3f]">{totalElements}</span> registros
          </span>
          <button
            type="button"
            disabled={loading || isLast}
            onClick={() => void loadPage(page + 1, appliedSearch)}
            className={paginationBtnClass}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PackageSearch, RotateCcw, Search, X } from 'lucide-react';
import { MODAL_OVERLAY_CLASS } from '@/components/modals/modalStack';
import { useSidebarData } from '@/hooks/useSidebarData';
import { useRubroCascadeFilters } from '@/hooks/useRubroCascadeFilters';
import { getHeaders, searchProduct, searchProductByInternalCode, type Sugerencia } from '@/services/products';
import type { ProductoDTO } from '@/interfaces/producto';
import { resolveCostoConIva } from '../utils/productoOfertaMetrics';
import { StockSucursalesTags } from './StockSucursalesTags';

const PAGE_SIZE = 5;
const BULK_PAGE_SIZE = 100;
const BULK_MAX_PAGES = 200;
const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all outline-none focus:border-[#0e8c85] focus:bg-white focus:ring-2 focus:ring-[#0e8c85]/20';
const rowClass = 'border-b border-slate-100 transition-colors hover:bg-slate-50/50 last:border-0';
const numberCellClass = 'px-3 py-2.5 text-right tabular-nums';

type Props = {
  open: boolean;
  selectedKeys: string[];
  defaultDtoPct: number;
  onChangeDefaultDtoPct: (value: number) => void;
  onClose: () => void;
  onAddProduct: (product: ProductoDTO) => boolean;
  onAddProducts: (products: ProductoDTO[]) => number;
};

function asNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return 0;
    const compact = raw.replace(/\s+/g, '');
    const normalized =
      compact.includes(',') && compact.includes('.')
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function asNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    const compact = raw.replace(/\s+/g, '');
    const normalized =
      compact.includes(',') && compact.includes('.')
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSearchText(text: string): string {
  return text
    .replace(/[()/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolvePrecioLista(product: ProductoDTO): number {
  const precioMarcado = asNumber(product.precioMarcado);
  if (precioMarcado > 0) return precioMarcado;
  const precioReferencia = asNumber(product.precioReferencia);
  if (precioReferencia > 0) return precioReferencia;
  const precioFinalPeso = asNumber(product.precioFinalPeso);
  if (precioFinalPeso > 0) return precioFinalPeso;
  const precioReposicion = asNumber(product.precioReposicion);
  if (precioReposicion > 0) return precioReposicion;
  const preven = asNumber(product.preven);
  const cotizacionUSD = asNumber(product.cotizacionUSD);
  if (preven > 0 && cotizacionUSD > 0) return preven * cotizacionUSD;
  if (preven > 0) return preven;
  return 0;
}

function computePrecioOferta(precioLista: number, dtoPct: number): number {
  return Math.max(0, precioLista * (1 - dtoPct / 100));
}

function money(value: number): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value || 0);
}

function productKey(product: ProductoDTO): string {
  return `${(product.tippro || '').trim()}-${(product.artcod || '').trim()}`;
}

export function ProductosSeleccionModal({
  open,
  selectedKeys,
  defaultDtoPct,
  onChangeDefaultDtoPct,
  onClose,
  onAddProduct,
  onAddProducts,
}: Props) {
  const { tipos, rubros, todosLosSubtipos, todasLasMarcas, loading: loadingRubros } = useSidebarData();
  const {
    selectedTipo,
    selectedSubtipoLabel: selectedSubtipo,
    selectedMarcaLabel: selectedMarca,
    rubrosFiltrados,
    subtiposFiltrados,
    marcasFiltradas,
    selectTipoByLabel,
    selectSubtipoByLabel,
    selectMarca,
    resetFilters: resetCascadeFilters,
  } = useRubroCascadeFilters({
    tipos,
    rubros,
    todosLosSubtipos,
    todasLasMarcas,
  });
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Sugerencia[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<ProductoDTO[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [lastSearch, setLastSearch] = useState<{ tippro?: string; artcod?: string; q?: string }>({});
  const [loadingBulkAdd, setLoadingBulkAdd] = useState(false);

  const selectedMap = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!searchInput.trim() || searchInput.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const normalized = normalizeSearchText(searchInput.trim());
        const data = await searchProduct(normalized);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [open, searchInput]);

  const fetchResults = async (opts?: { tippro?: string; artcod?: string; q?: string; page?: number }) => {
    const pageToLoad = Math.max(0, opts?.page ?? 0);
    let tippro = opts?.tippro;
    let artcod = opts?.artcod;
    let q = opts?.q;

    if (!tippro && !artcod && q == null) {
      if (opts?.page != null) {
        tippro = lastSearch.tippro;
        artcod = lastSearch.artcod;
        q = lastSearch.q;
      } else if (searchInput.trim()) {
        q = normalizeSearchText(searchInput);
      }
    }

    setLastSearch({
      tippro: tippro || undefined,
      artcod: artcod || undefined,
      q: q || undefined,
    });

    const params = new URLSearchParams();
    params.set('size', String(PAGE_SIZE));
    params.set('page', String(pageToLoad));
    if (selectedTipo) params.set('tipo', selectedTipo);
    if (selectedSubtipo) params.set('subtipo', selectedSubtipo);
    if (selectedMarca) params.set('marca', selectedMarca);
    if (tippro && artcod) {
      params.set('tippro', tippro);
      params.set('artcod', artcod);
    } else if (q) {
      params.set('q', normalizeSearchText(q));
    }

    setLoadingResults(true);
    try {
      const res = await fetch(`/api/catalogo/search?${params.toString()}`, {
        headers: getHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('search failed');
      const data = await res.json();
      if (Array.isArray(data?.content)) {
        const safeCurrentPage = Math.max(
          0,
          Math.trunc(asNumber(data?.number ?? data?.page?.number ?? data?.pageable?.pageNumber ?? pageToLoad))
        );
        const safeTotalPages = Math.max(0, Math.trunc(asNumber(data?.totalPages ?? data?.page?.totalPages)));
        const safeTotalResults = Math.max(0, Math.trunc(asNumber(data?.totalElements ?? data?.page?.totalElements)));
        const normalizedTotalPages =
          safeTotalPages > 0 ? safeTotalPages : data.content.length > 0 ? safeCurrentPage + 1 : 0;
        const normalizedTotalResults =
          safeTotalResults > 0 ? safeTotalResults : safeCurrentPage * PAGE_SIZE + data.content.length;

        setResults(data.content);
        setCurrentPage(safeCurrentPage);
        setTotalPages(normalizedTotalPages);
        setTotalResults(normalizedTotalResults);
      } else if (Array.isArray(data)) {
        setResults(data);
        setCurrentPage(0);
        setTotalPages(data.length > 0 ? 1 : 0);
        setTotalResults(data.length);
      } else {
        setResults([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalResults(0);
      }
    } catch {
      setResults([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalResults(0);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSuggestionClick = async (s: Sugerencia) => {
    const tippro = (s.tippro || '').trim();
    const artcod = (s.artcod || s.artdcod || '').trim();
    setShowSuggestions(false);
    if (tippro && artcod) {
      await fetchResults({ tippro, artcod });
      return;
    }
    if (s.descripcion?.trim()) {
      setSearchInput(s.descripcion.trim());
      await fetchResults({ q: s.descripcion.trim() });
    }
  };

  const handleSearch = async () => {
    setBulkFeedback(null);
    const term = searchInput.trim();
    if (!term) {
      await fetchResults();
      return;
    }
    if (/^\d{3,}$/.test(term)) {
      const product = await searchProductByInternalCode(term);
      if (product?.tippro && product?.artcod) {
        await fetchResults({ tippro: product.tippro, artcod: product.artcod });
        return;
      }
    }
    await fetchResults({ q: term });
  };

  const handleBulkAddFiltered = async () => {
    const confirmed = window.confirm('Se agregarán todos los productos que coincidan con los filtros actuales. ¿Continuar?');
    if (!confirmed) return;

    const currentSearchInput = searchInput.trim();
    const criteria: { tippro?: string; artcod?: string; q?: string } = {};
    if (currentSearchInput) {
      criteria.q = normalizeSearchText(currentSearchInput);
    } else if (lastSearch.tippro && lastSearch.artcod) {
      criteria.tippro = lastSearch.tippro;
      criteria.artcod = lastSearch.artcod;
    } else if (lastSearch.q) {
      criteria.q = lastSearch.q;
    }

    const paramsBase = new URLSearchParams();
    if (selectedTipo) paramsBase.set('tipo', selectedTipo);
    if (selectedSubtipo) paramsBase.set('subtipo', selectedSubtipo);
    if (selectedMarca) paramsBase.set('marca', selectedMarca);
    if (criteria.tippro && criteria.artcod) {
      paramsBase.set('tippro', criteria.tippro);
      paramsBase.set('artcod', criteria.artcod);
    } else if (criteria.q) {
      paramsBase.set('q', criteria.q);
    }

    setLoadingBulkAdd(true);
    try {
      const toAdd: ProductoDTO[] = [];
      const existingKeys = new Set(selectedMap);
      let page = 0;
      let pagesSeen = 0;
      let totalPagesBulk = 1;

      while (page < totalPagesBulk && pagesSeen < BULK_MAX_PAGES) {
        const params = new URLSearchParams(paramsBase);
        params.set('size', String(BULK_PAGE_SIZE));
        params.set('page', String(page));

        const res = await fetch(`/api/catalogo/search?${params.toString()}`, {
          headers: getHeaders(),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('bulk search failed');
        const data = await res.json();
        const content: ProductoDTO[] = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        const backendTotalPages = Math.max(
          0,
          Math.trunc(asNumber(data?.totalPages ?? data?.page?.totalPages ?? data?.pageable?.totalPages))
        );
        totalPagesBulk = backendTotalPages > 0 ? backendTotalPages : content.length > 0 ? page + 1 : 0;

        content.forEach((product) => {
          const key = productKey(product);
          if (!existingKeys.has(key)) {
            existingKeys.add(key);
            toAdd.push(product);
          }
        });

        page += 1;
        pagesSeen += 1;
      }

      const addedCount = onAddProducts(toAdd);
      if (addedCount > 0) {
        setBulkFeedback(`Se agregaron ${addedCount} producto(s). Podés seguir buscando o filtrando.`);
      } else {
        setBulkFeedback('No había productos nuevos para agregar con los filtros actuales.');
      }
    } catch {
      setBulkFeedback('No se pudieron agregar los productos filtrados.');
    } finally {
      setLoadingBulkAdd(false);
    }
  };

  const handleAddSingle = (product: ProductoDTO) => {
    onAddProduct(product);
  };

  if (!open) return null;

  const showingFrom = totalResults === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const showingTo = totalResults === 0 ? 0 : currentPage * PAGE_SIZE + results.length;

  return createPortal(
    <div className={MODAL_OVERLAY_CLASS} role="dialog" aria-modal="true">
      <div
        className="flex h-[min(92vh,960px)] w-full max-w-[min(96vw,90rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#001f3f]">Agregar productos</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Buscá, filtrá y agregá productos a la estrategia.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-2xl lg:max-w-2xl">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSearch();
                  }}
                  onFocus={() => searchInput.trim().length > 2 && suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                  placeholder="Buscar producto o código interno"
                  className={`${inputClass} h-11 pr-12 shadow-sm focus:shadow-md`}
                />
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0e8c85]"
                >
                  <Search className="h-4 w-4" />
                </button>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                    {suggestions.map((s, idx) => (
                      <button
                        type="button"
                        key={`${s.tippro}-${s.artcod}-${idx}`}
                        onClick={() => void handleSuggestionClick(s)}
                        className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {s.descripcion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#001f3f]">Filtros productos</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6 xl:grid-cols-12">
                <label className="block md:col-span-2 xl:col-span-2">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoría</span>
                  <select
                    value={selectedTipo}
                    onChange={(e) => selectTipoByLabel(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Todas</option>
                    {rubrosFiltrados.map((tipo) => (
                      <option key={tipo.id} value={tipo.label}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-4 xl:col-span-3">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Subcategoría</span>
                  <select
                    value={selectedSubtipo}
                    onChange={(e) => selectSubtipoByLabel(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Todas</option>
                    {subtiposFiltrados.map((subtipo, index) => (
                      <option key={`${subtipo.id}-${subtipo.label}-${index}`} value={subtipo.label}>
                        {subtipo.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-2 xl:col-span-2">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Marca</span>
                  <select
                    value={selectedMarca}
                    onChange={(e) => selectMarca(e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">Todas</option>
                    {marcasFiltradas.map((marca, index) => (
                      <option key={`${marca.id}-${marca.label}-${index}`} value={marca.label}>
                        {marca.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-2 xl:col-span-2">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Desc. global base
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      value={defaultDtoPct}
                      onChange={(e) => onChangeDefaultDtoPct(Number(e.target.value) || 0)}
                      className={`${inputClass} pr-9`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">%</span>
                  </div>
                </label>

                <div className="flex items-end gap-2 md:col-span-6 xl:col-span-3">
                  <button
                    type="button"
                    onClick={() => void fetchResults()}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#001f3f] text-white hover:bg-[#002b52]"
                    title="Buscar"
                    aria-label="Buscar"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetCascadeFilters();
                      setSearchInput('');
                      setResults([]);
                      setCurrentPage(0);
                      setTotalPages(0);
                      setTotalResults(0);
                      setLastSearch({});
                      setBulkFeedback(null);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                    title="Limpiar"
                    aria-label="Limpiar"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkAddFiltered()}
                    disabled={loadingBulkAdd || loadingResults}
                    className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-lg border border-[#0e8c85]/30 bg-[#0e8c85]/10 px-3 text-[10px] font-bold uppercase tracking-wide text-[#0b6f69] hover:bg-[#0e8c85]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Agregar todos los filtrados"
                    aria-label="Agregar todos los filtrados"
                  >
                    {loadingBulkAdd ? 'Agregando...' : 'Agregar filtrados'}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="bg-[#001f3f] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                Resultados de productos
              </div>
              <div className="overflow-auto">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col />
                    <col className="w-[100px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[100px]" />
                    <col className="w-[96px]" />
                  </colgroup>
                  <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        <span className="block">Producto / SKU</span>
                        <span className="mt-0.5 block text-[9px] font-medium normal-case tracking-normal text-slate-400">
                          Stock disp. por sucursal
                        </span>
                      </th>
                      <th className="px-3 py-2 text-right">P. lista</th>
                      <th className="px-3 py-2 text-right">Costo</th>
                      <th className="px-3 py-2 text-right">DTO%</th>
                      <th className="px-3 py-2 text-right">P. oferta</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingResults ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={`results-skeleton-${idx}`} className={rowClass}>
                          <td className="px-3 py-3">
                            <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
                          </td>
                          <td className={`${numberCellClass} py-3`}>
                            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-200" />
                          </td>
                          <td className={`${numberCellClass} py-3`}>
                            <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-200" />
                          </td>
                          <td className={`${numberCellClass} py-3`}>
                            <div className="ml-auto h-4 w-10 animate-pulse rounded bg-slate-200" />
                          </td>
                          <td className={`${numberCellClass} py-3`}>
                            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-200" />
                          </td>
                          <td className="px-3 py-3">
                            <div className="ml-auto h-8 w-20 animate-pulse rounded bg-slate-200" />
                          </td>
                        </tr>
                      ))
                    ) : results.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                          <div className="mx-auto flex max-w-sm items-center justify-center gap-2 font-medium">
                            <PackageSearch className="h-4 w-4 text-slate-400" />
                            Aplicá filtros o buscá un producto para empezar.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      results.map((product) => {
                        const key = productKey(product);
                        const exists = selectedMap.has(key);
                        const stockNoa = asNumber(product.stockNoa);
                        const stockNea = asNumber(product.stockNea);
                        const stockBue = asNumber(product.stockBue);
                        const stockCuy = asNumber(product.stockCuy);
                        const precioLista = resolvePrecioLista(product);
                        const costo = resolveCostoConIva(asNullableNumber(product.precioCosto), product.iva);
                        const precioOferta = computePrecioOferta(precioLista, defaultDtoPct);
                        return (
                          <tr key={key} className={rowClass}>
                            <td className="px-3 py-2.5">
                              <p className="font-semibold uppercase leading-snug text-[#001f3f]" title={product.descripcion}>
                                {product.descripcion}
                              </p>
                              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                {(product.tippro || '').trim()}
                                {(product.artcod || '').trim()}
                              </p>
                              <StockSucursalesTags
                                noa={stockNoa}
                                nea={stockNea}
                                bue={stockBue}
                                cuy={stockCuy}
                                className="mt-2"
                              />
                            </td>
                            <td className={`${numberCellClass} min-w-[110px] font-bold text-slate-700`}>${money(precioLista)}</td>
                            <td className={`${numberCellClass} text-slate-500`}>
                              {costo == null ? 'N/D' : `$${money(costo)}`}
                            </td>
                            <td className={`${numberCellClass} font-semibold text-[#003f9e]`}>{defaultDtoPct.toFixed(1)}</td>
                            <td className={numberCellClass}>
                              <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
                                ${money(precioOferta)}
                              </span>
                            </td>
                            <td className={numberCellClass}>
                              <button
                                type="button"
                                onClick={() => handleAddSingle(product)}
                                disabled={exists}
                                className="inline-flex items-center rounded-lg border border-[#0e8c85] bg-[#0e8c85] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {exists ? 'Agregado' : 'Agregar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Mostrando {showingFrom}-{showingTo} de {totalResults}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void fetchResults({ page: currentPage - 1 })}
                    disabled={loadingResults || currentPage <= 0}
                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="min-w-[72px] text-center text-xs font-semibold text-slate-500">
                    Página {totalPages === 0 ? 0 : currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => void fetchResults({ page: currentPage + 1 })}
                    disabled={loadingResults || totalPages === 0 || currentPage >= totalPages - 1}
                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>

            {bulkFeedback ? (
              <p className="rounded-xl border border-[#0e8c85]/30 bg-[#ebf8f4] px-4 py-2 text-xs font-semibold text-[#0b6f69]">
                {bulkFeedback}
              </p>
            ) : null}

            {loadingRubros ? <p className="text-xs font-bold text-gray-400">Cargando filtros de catálogo...</p> : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

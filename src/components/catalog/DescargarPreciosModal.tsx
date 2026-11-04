'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '@/components/modals/Modal';
import {
  PRECIO_EXPORT_COLUMNS,
  type DatosExportScope,
  type PrecioExportColumn,
  type TipoArchivoExport,
  downloadPreciosPdf,
  downloadPreciosXlsx,
  extractCotizacionUSD,
  fetchCatalogForExport,
  prepareExportPrices,
} from '@/utils/catalogExport';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  searchParams: URLSearchParams;
  nrocta: string;
  clienteNombre: string;
  markupPercentage: number;
  defaultDatos?: DatosExportScope;
};

function Segmented<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string; icon?: ReactNode }[];
  disabled?: boolean;
}) {
  return (
    <div
      className={`grid gap-2 ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all disabled:opacity-50 ${
              active
                ? 'border-[#0e8c85] bg-[#0e8c85]/10 ring-1 ring-[#0e8c85]/40'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.icon ? (
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  active ? 'bg-[#0e8c85] text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {opt.icon}
              </span>
            ) : null}
            <span className="min-w-0">
              <span
                className={`block text-sm font-bold ${
                  active ? 'text-[#0b6f69]' : 'text-gray-800'
                }`}
              >
                {opt.label}
              </span>
              {opt.hint ? (
                <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
                  {opt.hint}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function DescargarPreciosModal({
  isOpen,
  onClose,
  searchParams,
  nrocta,
  clienteNombre,
  markupPercentage,
  defaultDatos = 'A',
}: Props) {
  const [aplicaConversion, setAplicaConversion] = useState(true);
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [datos, setDatos] = useState<DatosExportScope>(defaultDatos);
  const [formato, setFormato] = useState<TipoArchivoExport>('E');
  const [columnas, setColumnas] = useState<PrecioExportColumn[]>(() =>
    PRECIO_EXPORT_COLUMNS.map((c) => c.key),
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isOpen) setDatos(defaultDatos);
  }, [isOpen, defaultDatos]);

  const allSelected = columnas.length === PRECIO_EXPORT_COLUMNS.length;
  const progressPct =
    totalCount > 0 ? Math.min(100, Math.round((loadedCount / totalCount) * 100)) : busy ? 15 : 0;

  const resumen = useMemo(() => {
    const parts = [
      datos === 'A' ? 'Filtros actuales' : 'Catálogo completo',
      formato === 'E' ? 'Excel' : 'PDF',
    ];
    if (aplicaConversion) parts.push(moneda === 'ARS' ? 'Pesos' : 'Dólares');
    if (formato === 'E') {
      parts.push(allSelected ? 'Todas las columnas' : `${columnas.length} columnas`);
    }
    if (markupPercentage > 0) parts.push(`Markup ${markupPercentage}%`);
    return parts.join(' · ');
  }, [datos, formato, aplicaConversion, moneda, allSelected, columnas.length, markupPercentage]);

  const toggleColumna = (key: PrecioExportColumn) => {
    setColumnas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const selectAllColumns = () => setColumnas(PRECIO_EXPORT_COLUMNS.map((c) => c.key));
  const clearColumns = () => setColumnas([]);

  const handleDescargar = async () => {
    if (!nrocta?.trim()) {
      toast.warning('Por favor seleccione un cliente para descargar un catálogo');
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      toast.error('Sesión no válida. Inicie sesión nuevamente.');
      return;
    }
    if (formato === 'E' && columnas.length === 0) {
      toast.warning('Seleccione al menos una columna para Excel');
      return;
    }

    setBusy(true);
    setProgress('Preparando…');
    setLoadedCount(0);
    setTotalCount(0);
    try {
      const products = await fetchCatalogForExport({
        token,
        nrocta: nrocta.trim(),
        mode: datos,
        searchParams: datos === 'A' ? searchParams : undefined,
        pageSize: 500,
        onProgress: (loaded, total) => {
          setLoadedCount(loaded);
          setTotalCount(total);
          setProgress(`Cargando productos…`);
        },
      });

      if (!products.length) {
        toast.error('No hay datos en el catálogo para generar archivo');
        return;
      }

      const cotizacion = extractCotizacionUSD(products);
      setProgress('Armando archivo…');
      const rows = prepareExportPrices(products, {
        aplicaConversion,
        moneda,
        markupPercentage,
        cotizacionUSD: cotizacion || 1,
      });

      if (!rows.length) {
        toast.error('No hay productos con precio para exportar');
        return;
      }

      const meta = {
        clienteNombre: clienteNombre || nrocta,
        cotizacionUSD: cotizacion || 0,
        markupPercentage,
      };

      if (formato === 'E') {
        downloadPreciosXlsx(rows, columnas, meta);
      } else {
        downloadPreciosPdf(rows, meta);
      }
      toast.success(`Listo: ${rows.length} productos`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al generar la descarga');
    } finally {
      setBusy(false);
      setProgress(null);
      setLoadedCount(0);
      setTotalCount(0);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => undefined : onClose}
      contentClassName="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      {/* Header */}
      <div className="relative border-b border-gray-100 bg-gradient-to-br from-[#001f3f] to-[#0a3a5c] px-5 pb-5 pt-5 text-white">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Download size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">Descargar precios</h2>
            <p className="mt-0.5 text-xs text-white/70">
              Exportá el listado con precios del cliente activo
            </p>
          </div>
        </div>
        {(clienteNombre || nrocta) && (
          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs">
            <span className="shrink-0 text-white/60">Cliente</span>
            <span className="truncate font-semibold">{clienteNombre || nrocta}</span>
            {nrocta ? (
              <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
                {nrocta}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="max-h-[min(70vh,560px)] space-y-5 overflow-y-auto px-5 py-5">
        {/* Alcance */}
        <section>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Qué descargar
          </h3>
          <Segmented
            value={datos}
            onChange={setDatos}
            disabled={busy}
            options={[
              {
                value: 'A',
                label: 'Selección actual',
                hint: 'Respeta filtros del catálogo',
                icon: <Filter size={16} />,
              },
              {
                value: 'C',
                label: 'Catálogo completo',
                hint: 'Todos los productos con precio',
                icon: <Layers size={16} />,
              },
            ]}
          />
        </section>

        {/* Formato */}
        <section>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Formato
          </h3>
          <Segmented
            value={formato}
            onChange={setFormato}
            disabled={busy}
            options={[
              {
                value: 'E',
                label: 'Excel',
                hint: 'Elegí columnas',
                icon: <FileSpreadsheet size={16} />,
              },
              {
                value: 'P',
                label: 'PDF',
                hint: 'Listado compacto',
                icon: <FileText size={16} />,
              },
            ]}
          />
        </section>

        {/* Moneda */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Moneda
            </h3>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAplicaConversion((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                aplicaConversion ? 'bg-[#0e8c85]' : 'bg-gray-300'
              }`}
              aria-pressed={aplicaConversion}
              title="Aplicar conversión"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  aplicaConversion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="mb-2 text-[11px] text-gray-500">
            {aplicaConversion
              ? 'Convertí todos los precios a una sola moneda'
              : 'Se mantiene la moneda original de cada ítem'}
          </p>
          {aplicaConversion && (
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              {(['ARS', 'USD'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={busy}
                  onClick={() => setMoneda(m)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                    moneda === m
                      ? 'bg-[#001f3f] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {m === 'ARS' ? 'Pesos' : 'Dólares'}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Columnas Excel */}
        {formato === 'E' && (
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Columnas Excel
              </h3>
              <div className="flex gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  disabled={busy}
                  onClick={selectAllColumns}
                  className="text-[#0e8c85] hover:underline disabled:opacity-50"
                >
                  Todas
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={clearColumns}
                  className="text-gray-500 hover:underline disabled:opacity-50"
                >
                  Ninguna
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRECIO_EXPORT_COLUMNS.map((c) => {
                const on = columnas.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleColumna(c.key)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                      on
                        ? 'border-[#0e8c85]/40 bg-[#0e8c85]/10 text-[#0b6f69]'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {on ? <Check size={12} strokeWidth={3} /> : null}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Resumen */}
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2.5 text-[11px] text-gray-600">
          <span className="font-semibold text-gray-800">Resumen: </span>
          {resumen}
        </div>

        {busy && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-[#0e8c85]" />
                {progress}
              </span>
              {totalCount > 0 ? (
                <span className="tabular-nums">
                  {loadedCount} / {totalCount}
                </span>
              ) : null}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#0e8c85] transition-all duration-300"
                style={{ width: `${Math.max(progressPct, 8)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/90 px-5 py-4">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-200/60 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleDescargar()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0e8c85] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-[#0c7a74] disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {busy ? 'Generando…' : 'Descargar'}
        </button>
      </div>
    </Modal>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Check, FileSpreadsheet, Loader2, X } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import {
  postOfertaProductosResolver,
  type OfertaProductoResolverEncontrado,
  type OfertaProductoResolverNoEncontrado,
  type OfertaProductoResolverResponse,
} from '@/services/admin';
import type { OfertaProductoSeleccionado } from '../utils/productoOfertaMetrics';
import { mapResolverItemToOfertaProducto } from '../utils/productoOfertaMetrics';
import { downloadProductosPlantillaExcel, parseProductosExcelFile } from '../utils/productosExcel';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productos: OfertaProductoSeleccionado[]) => void;
};

type PreviewState = {
  response: OfertaProductoResolverResponse;
  fileName: string;
};

export function ProductosExcelImportModal({ isOpen, onClose, onConfirm }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const reset = () => {
    setLoading(false);
    setError(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setError(null);
    setPreview(null);
    if (!file.name.match(/\.xlsx$/i)) {
      setError('Formato no válido. Solo se aceptan archivos .xlsx');
      return;
    }
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseProductosExcelFile(buffer);
      const response = await postOfertaProductosResolver(
        rows.map((r) => ({
          sku: r.sku,
          descripcion: r.descripcion,
          cantidad: r.cantidad,
          dtoPct: r.dtoPct,
        }))
      );
      setPreview({ response, fileName: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    const productos = preview.response.encontrados.map(mapResolverItemToOfertaProducto);
    onConfirm(productos);
    handleClose();
  };

  const encontrados = preview?.response.encontrados ?? [];
  const noEncontrados = preview?.response.noEncontrados ?? [];
  const duplicados = preview?.response.duplicadosOmitidos ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      contentClassName="flex max-h-[min(92vh,900px)] w-full max-w-[min(96vw,56rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-[#0e8c85]" />
          <h2 className="text-[14px] font-black uppercase tracking-wide text-[#001f3f]">
            Importar productos desde Excel
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {!preview ? (
          <div className="space-y-4">
            <p className="text-[12px] font-semibold text-slate-600">
              Archivo <strong>.xlsx</strong> con columnas <strong>SKU</strong>, <strong>DESCRIPCION</strong>,{' '}
              <strong>CANTIDAD</strong> y <strong>% DESCUENTO</strong> en la primera fila. Solo se agregarán
              productos existentes en el catálogo.
            </p>
            <button
              type="button"
              onClick={downloadProductosPlantillaExcel}
              className="text-[11px] font-bold uppercase tracking-wide text-[#0e8c85] hover:underline"
            >
              Descargar plantilla de ejemplo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#0e8c85]/40 bg-[#ebf8f4]/50 px-4 py-8 text-[12px] font-bold uppercase tracking-wide text-[#001f3f] transition hover:border-[#0e8c85] hover:bg-[#ebf8f4] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#0e8c85]" />
                  Validando productos…
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 text-[#0e8c85]" />
                  Seleccionar archivo .xlsx
                </>
              )}
            </button>
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-800">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[12px] font-semibold text-slate-600">
              Archivo: <span className="text-[#001f3f]">{preview.fileName}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                <Check className="h-3 w-3" />
                {encontrados.length} válidos
              </span>
              {noEncontrados.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-800">
                  <X className="h-3 w-3" />
                  {noEncontrados.length} no encontrados
                </span>
              ) : null}
              {duplicados > 0 ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {duplicados} duplicados omitidos
                </span>
              ) : null}
            </div>

            {encontrados.length > 0 ? (
              <PreviewTable title="Productos a agregar" rows={encontrados} />
            ) : null}

            {noEncontrados.length > 0 ? (
              <PreviewTableNoEncontrados rows={noEncontrados} />
            ) : null}
          </div>
        )}
      </div>

      {preview ? (
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setError(null);
            }}
            className="rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
          >
            Elegir otro archivo
          </button>
          <button
            type="button"
            disabled={encontrados.length === 0}
            onClick={handleConfirm}
            className="rounded-xl bg-[#0e8c85] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-[#0c7a74] disabled:opacity-50"
          >
            Agregar {encontrados.length} válidos a la lista
          </button>
        </div>
      ) : null}
    </Modal>
  );
}

function PreviewTable({
  title,
  rows,
}: {
  title: string;
  rows: OfertaProductoResolverEncontrado[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <div className="max-h-[200px] overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-white text-[10px] font-black uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Cant.</th>
              <th className="px-3 py-2">DTO%</th>
              <th className="px-3 py-2">Catálogo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={`${row.tippro}-${row.artcod}`} className="text-slate-700">
                <td className="px-3 py-2 font-mono font-bold">{row.sku}</td>
                <td className="px-3 py-2 tabular-nums">{row.cantidad}</td>
                <td className="px-3 py-2 tabular-nums">{row.dtoPct}%</td>
                <td className="max-w-[160px] truncate px-3 py-2" title={row.descripcion}>
                  {row.descripcion || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewTableNoEncontrados({
  rows,
}: {
  rows: OfertaProductoResolverNoEncontrado[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-red-100">
      <p className="border-b border-red-50 bg-red-50/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-700">
        No encontrados en catálogo
      </p>
      <div className="max-h-[120px] overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-white text-[10px] font-black uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Descripción (Excel)</th>
              <th className="px-3 py-2">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row, idx) => (
              <tr key={`${row.sku}-${idx}`} className="text-slate-600">
                <td className="px-3 py-2 font-mono font-bold">{row.sku || '—'}</td>
                <td className="max-w-[160px] truncate px-3 py-2" title={row.descripcion}>
                  {row.descripcion || '—'}
                </td>
                <td className="px-3 py-2 text-[10px] font-bold uppercase text-red-700">
                  {row.motivo === 'SKU_INVALIDO' ? 'SKU inválido' : 'No existe'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

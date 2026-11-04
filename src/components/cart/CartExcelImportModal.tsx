'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, Check, Download, FileSpreadsheet, Loader2, X } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import { extractErrorMessage } from '@/utils/apiError';
import {
  CART_IMPORT_MAX_ROWS,
  downloadCartPlantillaExcel,
  parseCartExcelFile,
  validateCartExcelRows,
  type CartExcelLocalError,
  type CartExcelRow,
} from '@/utils/cartExcel';

export type CartImportErrorRow = {
  row: number;
  codigo: string;
  message: string;
};

export type CartImportResult = {
  imported: number;
  errors: CartImportErrorRow[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: CartExcelRow[]) => Promise<CartImportResult>;
};

type PreviewState = {
  rows: CartExcelRow[];
  fileName: string;
  localErrors: CartExcelLocalError[];
};

function ErrorTable({ errors, title }: { errors: CartImportErrorRow[]; title: string }) {
  if (errors.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-red-100">
      <div className="border-b border-red-100 bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-red-800">
        {title}
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-white text-[9px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Fila</th>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {errors.map((err, idx) => (
              <tr key={`${err.row}-${err.codigo}-${idx}`}>
                <td className="px-3 py-2 font-semibold text-slate-700">{err.row}</td>
                <td className="px-3 py-2 font-mono text-slate-800">{err.codigo || '—'}</td>
                <td className="px-3 py-2 text-red-700">{err.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CartExcelImportModal({ isOpen, onClose, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [result, setResult] = useState<CartImportResult | null>(null);

  const reset = () => {
    setLoading(false);
    setImporting(false);
    setError(null);
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setError(null);
    setPreview(null);
    setResult(null);
    if (!file.name.match(/\.xlsx$/i)) {
      setError('Formato no válido. Solo se aceptan archivos .xlsx');
      return;
    }
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseCartExcelFile(buffer, CART_IMPORT_MAX_ROWS);
      const localErrors = validateCartExcelRows(rows);
      setPreview({ rows, fileName: file.name, localErrors });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setImporting(true);
    setError(null);
    try {
      const localErrors = preview.localErrors.length
        ? preview.localErrors
        : validateCartExcelRows(preview.rows);
      const validRows = preview.rows.filter(
        (r) => r.codigo?.trim() && r.cantidad > 0,
      );

      if (validRows.length === 0) {
        setResult({
          imported: 0,
          errors: localErrors.map((e) => ({
            row: e.row,
            codigo: e.codigo,
            message: e.message,
          })),
        });
        return;
      }

      const res = await onImport(validRows);
      const mergedErrors = [
        ...localErrors.map((e) => ({
          row: e.row,
          codigo: e.codigo,
          message: e.message,
        })),
        ...(res.errors ?? []),
      ].sort((a, b) => a.row - b.row);

      setResult({
        imported: res.imported ?? 0,
        errors: mergedErrors,
      });
    } catch (e) {
      setError(extractErrorMessage(e, 'No se pudo importar el archivo'));
    } finally {
      setImporting(false);
    }
  };

  const previewRows = preview?.rows ?? [];
  const previewLocalErrors = preview?.localErrors ?? [];
  const resultErrors = result?.errors ?? [];
  const validPreviewCount = previewRows.filter((r) => r.codigo?.trim() && r.cantidad > 0).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      contentClassName="flex max-h-[min(92vh,900px)] w-full max-w-[min(96vw,40rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-[#0e8c85]" />
          <h2 className="text-[14px] font-black uppercase tracking-wide text-[#001f3f]">
            Agregar productos al carrito
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
        {result ? (
          <div className="space-y-4">
            {result.imported > 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="flex items-center gap-2 text-[13px] font-bold text-emerald-900">
                  <Check className="h-4 w-4" />
                  Se importaron {result.imported} producto{result.imported === 1 ? '' : 's'}
                </p>
                {resultErrors.length > 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-800">
                    {resultErrors.length} fila{resultErrors.length === 1 ? '' : 's'} no se pudo
                    {resultErrors.length === 1 ? '' : 'n'} importar
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="flex items-center gap-2 text-[13px] font-bold text-red-900">
                  <AlertTriangle className="h-4 w-4" />
                  No se importó ningún producto
                </p>
                <p className="mt-1 text-[11px] font-semibold text-red-800">
                  Revisá los motivos de error a continuación.
                </p>
              </div>
            )}

            <ErrorTable errors={resultErrors} title="Detalle de errores / motivos" />
          </div>
        ) : !preview ? (
          <div className="space-y-4">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#001f3f] px-4 py-3.5 text-[12px] font-black uppercase tracking-wide text-white transition hover:bg-[#003366] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Leyendo archivo…
                </>
              ) : (
                <>Seleccionar el archivo para importar</>
              )}
            </button>

            <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-[12px] text-slate-700">
              <p className="mb-2 font-black uppercase tracking-wide text-[#001f3f]">
                Formato del archivo:
              </p>
              <ul className="list-disc space-y-1.5 pl-4 font-semibold leading-snug">
                <li>No debe tener columnas en blanco al principio.</li>
                <li>La primera fila debe contener los títulos (Codigo, Cantidad).</li>
                <li>
                  No debe poseer más de <strong>{CART_IMPORT_MAX_ROWS} filas</strong> con los
                  productos a importar.
                </li>
                <li>
                  Las columnas <strong>Codigo</strong> y <strong>Cantidad</strong> son
                  obligatorias (recomendado: en ese orden, como primeras columnas). Podés
                  incluir columnas extra (ej. Descripcion).
                </li>
              </ul>
              <p className="mt-3 text-[11px] font-semibold leading-relaxed text-slate-600">
                Recomendación: Si ocurre un error en la importación, pruebe utilizar el archivo de
                ejemplo que se proporciona a continuación. Recuerde respetar el orden de las
                columnas y títulos.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadCartPlantillaExcel}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e8c85] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-white hover:bg-[#0b6f69]"
            >
              <Download className="h-4 w-4" />
              Descargar Excel de ejemplo
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
              Archivo <strong>{preview.fileName}</strong>: {previewRows.length} fila
              {previewRows.length === 1 ? '' : 's'} leída{previewRows.length === 1 ? '' : 's'} (
              {validPreviewCount} válida{validPreviewCount === 1 ? '' : 's'} para importar).
            </p>

            {previewLocalErrors.length > 0 && (
              <ErrorTable
                errors={previewLocalErrors}
                title="Motivos de error en la vista previa"
              />
            )}

            <div className="overflow-hidden rounded-xl border border-slate-100">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Fila</th>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((r) => {
                      const invalid = !r.codigo?.trim() || r.cantidad <= 0;
                      return (
                        <tr
                          key={`${r.row}-${r.codigo}`}
                          className={invalid ? 'bg-red-50/60' : undefined}
                        >
                          <td className="px-3 py-2 text-slate-500">{r.row}</td>
                          <td className="px-3 py-2 font-mono text-slate-800">{r.codigo || '—'}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">
                            {r.cantidad}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-800">
                {error}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
        {result ? (
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl bg-[#001f3f] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white"
          >
            Cerrar
          </button>
        ) : preview ? (
          <>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              disabled={importing}
              className="rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={importing || validPreviewCount === 0}
              className="flex items-center gap-2 rounded-xl bg-[#0e8c85] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Importando…
                </>
              ) : (
                <>Importar al carrito</>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </Modal>
  );
}

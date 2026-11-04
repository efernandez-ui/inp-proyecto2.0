'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, Check, FileSpreadsheet, Loader2, X } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import {
  postSegmentacionClientesResolver,
  type SegmentacionClienteResolverEncontrado,
  type SegmentacionClienteResolverNoEncontrado,
  type SegmentacionClienteResolverResponse,
} from '@/services/admin';
import type { ClienteSegmentacionItem } from '../segmentacionTypes';
import { downloadClientesPlantillaExcel, parseClientesExcelFile } from '../utils/clientesExcel';
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (clientes: ClienteSegmentacionItem[]) => void;
};

type PreviewState = {
  response: SegmentacionClienteResolverResponse;
  fileName: string;
};

export function ClientesExcelImportModal({ isOpen, onClose, onConfirm }: Props) {
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
      const rows = parseClientesExcelFile(buffer);
      const response = await postSegmentacionClientesResolver(
        rows.map((r) => ({ nrocta: r.nrocta, razonSocial: r.razonSocial }))
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
    const clientes: ClienteSegmentacionItem[] = preview.response.encontrados.map((c) => ({
      nrocta: c.nrocta,
      nombre: c.nombre,
    }));
    onConfirm(clientes);
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
            Importar clientes desde Excel
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
              Archivo <strong>.xlsx</strong> con columnas <strong>NROCTA</strong> y <strong>RAZÓN SOCIAL</strong>{' '}
              en la primera fila. Solo se agregarán cuentas activas en el ERP.
            </p>
            <button
              type="button"
              onClick={downloadClientesPlantillaExcel}
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
                  Validando clientes…
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
              <PreviewTable title="Clientes a agregar" rows={encontrados} />
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
  rows: SegmentacionClienteResolverEncontrado[];
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
              <th className="px-3 py-2">NROCTA</th>
              <th className="px-3 py-2">Excel</th>
              <th className="px-3 py-2">ERP</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.nrocta} className="text-slate-700">
                <td className="px-3 py-2 font-mono font-bold">{row.nrocta}</td>
                <td className="max-w-[120px] truncate px-3 py-2" title={row.razonSocialExcel}>
                  {row.razonSocialExcel || '—'}
                </td>
                <td className="max-w-[120px] truncate px-3 py-2" title={row.nombre}>
                  {row.nombre}
                </td>
                <td className="px-3 py-2">
                  {row.coincideRazonSocial ? (
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-700">
                      <Check className="h-3 w-3" /> OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 font-bold text-amber-700">
                      <AlertTriangle className="h-3 w-3" /> Nombre distinto
                    </span>
                  )}
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
  rows: SegmentacionClienteResolverNoEncontrado[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-red-100">
      <p className="border-b border-red-50 bg-red-50/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-700">
        No encontrados en ERP
      </p>
      <div className="max-h-[120px] overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-white text-[10px] font-black uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">NROCTA</th>
              <th className="px-3 py-2">Razón social (Excel)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.nrocta} className="text-slate-600">
                <td className="px-3 py-2 font-mono font-bold">{row.nrocta}</td>
                <td className="max-w-[200px] truncate px-3 py-2" title={row.razonSocial}>
                  {row.razonSocial || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

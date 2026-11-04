'use client';

import { useEffect, useState } from 'react';
import { Check, Paperclip, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  BANCO_LABELS,
  FORMAS_PAGO_OPTIONS,
  FORMA_PAGO_LABELS,
  PLAZO_OPTIONS,
  PLAZO_LABELS,
  crearInformePago,
  fetchCuentasBancarias,
  uploadAdjuntoInformePago,
  InformePagoDuplicadosError,
  type ConceptoTesoreria,
  type InformePagoItemPayload,
  type InformePagoPayload,
  type PosibleDuplicadoPago,
} from '@/services/informesPago';
import {
  formatCurrency,
  inputDateToApiDate,
  toApiDate,
  toInputDate,
} from '@/services/cuentaCorriente';

interface Props {
  open: boolean;
  onClose: () => void;
  token: string;
  nrocta: string;
  usuarioEmail?: string;
  onSuccess?: () => void;
}

type DraftItem = {
  sinNroTransferencia: boolean;
  nroComprobante: string;
  fechaComprobanteInput: string;
  bancoDestino: string;
  formaPago: string;
  plazoAcreditacion: string;
  sucursalDeposito: string;
  nombreOriginante: string;
  importe: string;
};

function emptyDraft(defaultBanco = 'MERPAG'): DraftItem {
  return {
    sinNroTransferencia: false,
    nroComprobante: '',
    fechaComprobanteInput: toInputDate(new Date()),
    bancoDestino: defaultBanco,
    formaPago: 'T',
    plazoAcreditacion: 'I',
    sucursalDeposito: '',
    nombreOriginante: '',
    importe: '',
  };
}

const CLOSE_CONFIRM_MSG =
  'Tenés datos cargados sin enviar. ¿Querés cerrar y descartarlos?';

/** ¿El formulario en edición tiene datos ingresados por el usuario? */
function draftHasData(d: DraftItem): boolean {
  return (
    d.nroComprobante.trim() !== '' ||
    d.nombreOriginante.trim() !== '' ||
    d.importe.trim() !== '' ||
    d.sucursalDeposito.trim() !== '' ||
    d.sinNroTransferencia
  );
}

/** Parsea "1.234.567,89" / "1234,89" / "1234.89" → number */
function parseImporteAr(raw: string): number {
  const t = raw.trim();
  if (!t) return NaN;
  const normalized = t.includes(',')
    ? t.replace(/\./g, '').replace(',', '.')
    : t.replace(/,/g, '');
  return Number(normalized);
}

function formatImporteAr(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Mientras escribe: solo dígitos y una coma/punto decimal */
function sanitizeImporteInput(raw: string): string {
  let s = raw.replace(/[^\d.,]/g, '');
  const sepIdx = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
  if (sepIdx >= 0) {
    const intPart = s.slice(0, sepIdx).replace(/[.,]/g, '');
    const decPart = s.slice(sepIdx + 1).replace(/[.,]/g, '').slice(0, 2);
    s = `${intPart},${decPart}`;
  } else {
    s = s.replace(/[.,]/g, '');
  }
  return s;
}

function bancoLabel(codigo: string, cuentas: ConceptoTesoreria[]): string {
  const fromApi = cuentas.find((c) => c.codigoConcepto === codigo);
  return BANCO_LABELS[codigo] ?? fromApi?.descrip ?? codigo;
}

export default function InformarPagoModal({
  open,
  onClose,
  token,
  nrocta,
  usuarioEmail,
  onSuccess,
}: Props) {
  const [cuentas, setCuentas] = useState<ConceptoTesoreria[]>([]);
  const [notas, setNotas] = useState('');
  const [draft, setDraft] = useState<DraftItem>(emptyDraft());
  const [items, setItems] = useState<InformePagoItemPayload[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [dupConfirm, setDupConfirm] = useState<PosibleDuplicadoPago[] | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchCuentasBancarias(token, nrocta)
      .then((data) => {
        setCuentas(data);
        const first = data.some((c) => c.codigoConcepto === 'MERPAG')
          ? 'MERPAG'
          : data[0]?.codigoConcepto ?? 'MERPAG';
        setDraft(emptyDraft(first));
      })
      .catch(() => {
        setCuentas([]);
        setDraft(emptyDraft());
      });
    setItems([]);
    setNotas('');
  }, [open, token, nrocta]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      const dirty = items.length > 0 || notas.trim() !== '' || draftHasData(draft);
      if (!dirty || window.confirm(CLOSE_CONFIRM_MSG)) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, notas, draft, onClose]);

  if (!open) return null;

  const showSucursal = draft.formaPago === 'D' || draft.formaPago === 'V';

  const patchDraft = (patch: Partial<DraftItem>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  /** Cierra pidiendo confirmación solo si hay datos cargados sin enviar. */
  const attemptClose = () => {
    const dirty = items.length > 0 || notas.trim() !== '' || draftHasData(draft);
    if (dirty && !window.confirm(CLOSE_CONFIRM_MSG)) return;
    onClose();
  };

  const validateDraft = (): string | null => {
    if (draft.bancoDestino === 'MERPAG') {
      if (!draft.nroComprobante.trim()) {
        return 'Mercado Pago requiere Nº de transferencia';
      }
    } else if (!draft.sinNroTransferencia && !draft.nroComprobante.trim()) {
      return 'Ingrese el Nº de transferencia';
    }
    if (!draft.fechaComprobanteInput) return 'Ingrese la fecha del comprobante';
    if (!draft.bancoDestino) return 'Seleccione el banco destino';
    if (!draft.formaPago) return 'Seleccione la forma de pago';
    if (!draft.plazoAcreditacion) return 'Seleccione el plazo';
    if (!draft.nombreOriginante.trim()) return 'Ingrese el nombre del titular';
    const importe = parseImporteAr(draft.importe);
    if (!Number.isFinite(importe) || importe <= 0) return 'El importe debe ser mayor a cero';
    return null;
  };

  const handleAgregarYLimpiar = () => {
    const error = validateDraft();
    if (error) {
      toast.error(error);
      return;
    }
    const importe = parseImporteAr(draft.importe);
    const nro =
      draft.sinNroTransferencia && draft.bancoDestino !== 'MERPAG'
        ? 'S/N'
        : draft.nroComprobante.trim();

    const item: InformePagoItemPayload = {
      nroComprobante: nro,
      fechaComprobante: inputDateToApiDate(draft.fechaComprobanteInput),
      bancoDestino: draft.bancoDestino,
      formaPago: draft.formaPago,
      plazoAcreditacion: draft.plazoAcreditacion,
      sucursalDeposito: showSucursal ? draft.sucursalDeposito.trim() : '',
      nombreOriginante: draft.nombreOriginante.trim(),
      importe,
    };
    setItems((prev) => [...prev, item]);
    setDraft(emptyDraft(draft.bancoDestino || cuentas[0]?.codigoConcepto || 'MERPAG'));
    toast.success('Comprobante agregado');
  };

  const handleUpload = async (idx: number, file: File | null) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const uploaded = await uploadAdjuntoInformePago(token, file, nrocta);
      setItems((prev) =>
        prev.map((p, i) =>
          i === idx
            ? {
                ...p,
                archivoAdjunto: uploaded.archivoAdjunto,
                nombreArchivoOriginal: uploaded.nombreArchivoOriginal,
              }
            : p,
        ),
      );
      toast.success('Comprobante adjunto');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al subir el comprobante');
    } finally {
      setUploadingIdx(null);
    }
  };

  const submitInforme = async (confirmarDuplicados: boolean) => {
    const payload: InformePagoPayload = {
      nroCuenta: nrocta,
      fechaInforme: toApiDate(new Date()),
      usuario: usuarioEmail,
      notas,
      pagos: items,
      confirmarDuplicados: confirmarDuplicados || undefined,
    };
    await crearInformePago(token, payload);
    toast.success('Informe de pago registrado correctamente');
    onSuccess?.();
    onClose();
    setItems([]);
    setNotas('');
    setDraft(emptyDraft());
    setDupConfirm(null);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Agregue al menos un comprobante');
      return;
    }
    if (items.some((i) => !i.archivoAdjunto)) {
      toast.error('Adjunte el comprobante de cada registro antes de enviar');
      return;
    }
    setSaving(true);
    try {
      await submitInforme(false);
    } catch (e: unknown) {
      if (e instanceof InformePagoDuplicadosError) {
        setDupConfirm(e.duplicados);
      } else {
        toast.error(e instanceof Error ? e.message : 'Error al informar pago');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDuplicadosAndSave = async () => {
    setSaving(true);
    try {
      await submitInforme(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al informar pago');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#001f3f] outline-none focus:border-[#0e8c85]';
  const rowClass = 'grid grid-cols-[104px_1fr] items-center gap-3';
  const rowLabelClass =
    'text-[10px] font-black uppercase leading-tight tracking-widest text-gray-500';

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-black uppercase tracking-tight text-[#001f3f]">
            Informar pago
          </h2>
          <button
            type="button"
            onClick={attemptClose}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
          {/* Columna izquierda: formulario */}
          <div className="space-y-3 border-b border-gray-100 px-6 py-4 md:border-b-0 md:border-r md:overflow-y-auto">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-600">
                Complete atentamente todos los datos, eso nos permitirá procesar con mayor rapidez
                su registro.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-[#001f3f]">
              <input
                type="checkbox"
                checked={draft.sinNroTransferencia}
                disabled={draft.bancoDestino === 'MERPAG'}
                onChange={(e) =>
                  patchDraft({
                    sinNroTransferencia: e.target.checked,
                    nroComprobante: e.target.checked ? '' : draft.nroComprobante,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-[#0e8c85] disabled:opacity-50"
              />
              Sin Nº de transferencia
            </label>

            {(!draft.sinNroTransferencia || draft.bancoDestino === 'MERPAG') && (
              <div className={rowClass}>
                <label className={rowLabelClass}>
                  Nº transf. <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass}
                  value={draft.nroComprobante}
                  onChange={(e) => patchDraft({ nroComprobante: e.target.value })}
                  placeholder="#"
                />
              </div>
            )}

            <div className={rowClass}>
              <label className={rowLabelClass}>
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                max={toInputDate(new Date())}
                className={inputClass}
                value={draft.fechaComprobanteInput}
                onChange={(e) => patchDraft({ fechaComprobanteInput: e.target.value })}
              />
            </div>

            <div className={rowClass}>
              <label className={rowLabelClass}>
                Banco dest. <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClass}
                value={draft.bancoDestino}
                onChange={(e) => {
                  const banco = e.target.value;
                  patchDraft({
                    bancoDestino: banco,
                    sinNroTransferencia: banco === 'MERPAG' ? false : draft.sinNroTransferencia,
                  });
                }}
              >
                <option value="">Seleccionar</option>
                {cuentas.map((c) => (
                  <option key={c.codigoConcepto} value={c.codigoConcepto}>
                    {BANCO_LABELS[c.codigoConcepto] ?? c.descrip ?? c.codigoConcepto}
                  </option>
                ))}
              </select>
            </div>

            <div className={rowClass}>
              <label className={rowLabelClass}>
                Forma pago <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClass}
                value={draft.formaPago}
                onChange={(e) => patchDraft({ formaPago: e.target.value })}
              >
                {FORMAS_PAGO_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {showSucursal && (
              <div className={rowClass}>
                <label className={rowLabelClass}>Sucursal</label>
                <input
                  className={inputClass}
                  value={draft.sucursalDeposito}
                  onChange={(e) => patchDraft({ sucursalDeposito: e.target.value })}
                />
              </div>
            )}

            <div className={rowClass}>
              <label className={rowLabelClass}>
                Plazo <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClass}
                value={draft.plazoAcreditacion}
                onChange={(e) => patchDraft({ plazoAcreditacion: e.target.value })}
              >
                {PLAZO_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={rowClass}>
              <label className={rowLabelClass}>
                Titular <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={draft.nombreOriginante}
                onChange={(e) => patchDraft({ nombreOriginante: e.target.value })}
              />
            </div>

            <div className={rowClass}>
              <label className={rowLabelClass}>
                Importe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${inputClass} pl-7 text-right`}
                  value={draft.importe}
                  onChange={(e) => patchDraft({ importe: sanitizeImporteInput(e.target.value) })}
                  onBlur={() => {
                    const n = parseImporteAr(draft.importe);
                    if (Number.isFinite(n) && n > 0) {
                      patchDraft({ importe: formatImporteAr(n) });
                    }
                  }}
                  placeholder="0,00"
                />
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
              (*) Campos obligatorios
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleAgregarYLimpiar}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0e8c85] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white hover:bg-[#0c7a74]"
              >
                <Check className="h-4 w-4" />
                Agregar
              </button>
              <button
                type="button"
                onClick={attemptClose}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          </div>

          {/* Columna derecha: comprobantes agregados + adjuntos + envío */}
          <div className="flex min-h-0 flex-col px-6 py-4 md:overflow-y-auto">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Comprobantes agregados ({items.length})
            </p>

            {items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-xs text-gray-400">
                Todavía no agregaste comprobantes.
                <br />
                Completá el formulario y presioná «Agregar».
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
                {items.map((item, idx) => (
                  <li
                    key={`${item.nroComprobante}-${idx}`}
                    className="flex items-start gap-3 px-3 py-3"
                  >
                    <div className="min-w-0 flex-1 text-sm text-[#001f3f]">
                      <p className="font-bold">
                        {FORMA_PAGO_LABELS[item.formaPago] ?? item.formaPago} ·{' '}
                        {formatCurrency(item.importe)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.nroComprobante} · {bancoLabel(item.bancoDestino, cuentas)} ·{' '}
                        {PLAZO_LABELS[item.plazoAcreditacion] ?? item.plazoAcreditacion}
                      </p>
                      <p className="text-xs text-gray-500">{item.nombreOriginante}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {item.archivoAdjunto ? (
                        <span className="inline-flex max-w-[150px] items-center gap-1 truncate rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0e8c85]">
                          <Paperclip className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {item.nombreArchivoOriginal ?? item.archivoAdjunto}
                          </span>
                        </span>
                      ) : (
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600 hover:border-[#0e8c85] hover:text-[#0e8c85]">
                          <Paperclip className="h-3 w-3" />
                          {uploadingIdx === idx ? 'Subiendo...' : 'Adjuntar *'}
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            disabled={uploadingIdx !== null}
                            onChange={(e) => handleUpload(idx, e.target.files?.[0] ?? null)}
                          />
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-2 text-[10px] text-gray-500">
              Formatos: JPG, PNG, WEBP o PDF · máximo 2 MB por archivo. Debe adjuntar un comprobante
              por cada registro.
            </p>

            <div className="mt-3">
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-500">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving || items.length === 0}
              className="mt-3 w-full rounded-xl bg-[#001f3f] px-4 py-3 text-xs font-black uppercase tracking-wide text-white hover:bg-[#002a55] disabled:opacity-60"
            >
              {saving ? 'Enviando...' : 'Informar pago'}
            </button>
          </div>
        </div>
      </div>

      {dupConfirm && (
        <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-black uppercase tracking-tight text-[#001f3f]">
              Posibles duplicados (Mercado Pago)
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Ya existen registros con el mismo importe y fecha de acreditación. ¿Desea continuar de
              todos modos?
            </p>
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-[#001f3f]">
              {dupConfirm.map((d, i) => (
                <li key={`${d.nroTransferencia ?? ''}-${d.fecha ?? ''}-${i}`}>
                  {d.label ||
                    `• Transacción Nº ${d.nroTransferencia ?? '—'} · ${d.fecha ?? '—'} · ${
                      d.importe != null ? formatCurrency(d.importe) : '—'
                    }`}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDupConfirm(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold uppercase text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void confirmDuplicadosAndSave()}
                className="rounded-xl bg-[#001f3f] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#002a55] disabled:opacity-60"
              >
                {saving ? 'Enviando...' : 'Confirmar de todos modos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

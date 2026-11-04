import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createPoolTipoOferta, type TipoOfertaPool } from '@/services/admin';
import { MODAL_OVERLAY_CLASS } from '@/components/modals/modalStack';
import { NUEVA_ESTRATEGIA_MINT } from '../constants';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Tras crear OK: cerrar modal, refrescar lista y seleccionar el nuevo código. */
  onCreated: (created: TipoOfertaPool) => void;
};

export function NuevoTipoOfertaPoolModal({ open, onClose, onCreated }: Props) {
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formDetalle, setFormDetalle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormCodigo('');
      setFormNombre('');
      setFormDetalle('');
      setError(null);
    }
  }, [open]);

  const reset = () => {
    setFormCodigo('');
    setFormNombre('');
    setFormDetalle('');
    setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const guardar = async () => {
    const cod = formCodigo.trim();
    if (!cod || cod.length > 2) {
      setError('El código es obligatorio y debe tener como máximo 2 caracteres.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createPoolTipoOferta({
        codigo: cod,
        descripcion: formNombre.trim() || null,
        descripcionDetalle: formDetalle.trim() || null,
      });
      reset();
      onCreated(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className={MODAL_OVERLAY_CLASS}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nuevo-tipo-titulo"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-[#001f3f] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="modal-nuevo-tipo-titulo" className="text-sm font-black uppercase tracking-wide text-[#001f3f]">
          Nuevo tipo de oferta
        </h3>
        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">Código (2)</span>
            <input
              value={formCodigo}
              onChange={(e) => setFormCodigo(e.target.value.slice(0, 2))}
              maxLength={2}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#001f3f] placeholder:text-gray-400 outline-none focus:border-[#0f766e]"
              placeholder="Ej. SP"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">Nombre (DESCRP)</span>
            <input
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#001f3f] placeholder:text-gray-400 outline-none focus:border-[#0f766e]"
              placeholder="Título corto"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
              Descripción (DESCR2)
            </span>
            <textarea
              value={formDetalle}
              onChange={(e) => setFormDetalle(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#001f3f] placeholder:text-gray-400 outline-none focus:border-[#0f766e]"
              placeholder="Texto largo opcional"
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-[12px] font-semibold text-red-600">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#001f3f] disabled:opacity-50"
            style={{ backgroundColor: NUEVA_ESTRATEGIA_MINT }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

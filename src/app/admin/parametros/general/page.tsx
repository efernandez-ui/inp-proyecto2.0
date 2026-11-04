'use client';

import { useEffect, useState } from 'react';
import { getParametrosGeneral, putParametrosGeneral, type ParametroGeneralPayload } from '@/services/admin';
import { ParametroField, ParametroTextInput } from '@/components/admin/parametros/ParametroField';
import { SnSwitch } from '@/components/admin/parametros/SnSwitch';
import { toast } from 'react-toastify';

function RowSwitch({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string | null | undefined;
  onChange: (v: 'S' | 'N') => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</div>
        {hint ? <div className="mt-0.5 text-[10px] font-medium text-gray-400">{hint}</div> : null}
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <span className="text-xs font-bold text-gray-500">{(value || 'N').toUpperCase() === 'S' ? 'Sí' : 'No'}</span>
        <SnSwitch value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export default function ParametrosGeneralPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<ParametroGeneralPayload>({});

  useEffect(() => {
    let c = false;
    setLoading(true);
    getParametrosGeneral()
      .then((p) => {
        if (!c) setD(p);
      })
      .catch(() => toast.error('No se pudo cargar la sección'))
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  const set = (k: keyof ParametroGeneralPayload, v: string | null | undefined) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const guardar = async () => {
    setSaving(true);
    try {
      const saved = await putParametrosGeneral(d);
      setD(saved);
      toast.success('Guardado');
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm font-bold text-gray-500">Cargando…</div>;
  }

  return (
    <div>
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ParametroField label="Link QR">
            <ParametroTextInput value={d.linkAccesoQr ?? ''} onChange={(v) => set('linkAccesoQr', v)} />
          </ParametroField>
          <ParametroField label="Versión">
            <ParametroTextInput value={d.version ?? ''} onChange={(v) => set('version', v)} />
          </ParametroField>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RowSwitch label="Modo prueba" value={d.modoPrueba} onChange={(v) => set('modoPrueba', v)} />
          <RowSwitch label="Sistema en mantenimiento" value={d.sistemaEnMantenimiento} onChange={(v) => set('sistemaEnMantenimiento', v)} />
          <RowSwitch label="Muestra novedades" value={d.muestraNovedades} onChange={(v) => set('muestraNovedades', v)} />
          <RowSwitch label="Muestra más comprados" value={d.muestraMasComprados} onChange={(v) => set('muestraMasComprados', v)} />
          <RowSwitch label="Muestra últimos ingresos" value={d.muestraUltimosIngresos} onChange={(v) => set('muestraUltimosIngresos', v)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <ParametroField label="Chat disponible" hint="T = público · R = registrados">
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    { k: 'T', label: 'Público' },
                    { k: 'R', label: 'Registrados' },
                  ] as const
                ).map((x) => {
                  const active = (d.disponibilidadChat || '').toUpperCase() === x.k;
                  return (
                    <button
                      key={x.k}
                      type="button"
                      onClick={() => set('disponibilidadChat', x.k)}
                      className={[
                        'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition',
                        active ? 'bg-[#001f3f] text-white shadow' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {x.label}
                    </button>
                  );
                })}
              </div>
            </ParametroField>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <ParametroField label="Tipo home" hint="A = slide · B = imagen única">
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    { k: 'A', label: 'Slide' },
                    { k: 'B', label: 'Imagen única' },
                  ] as const
                ).map((x) => {
                  const active = (d.tipoHome || '').toUpperCase() === x.k;
                  return (
                    <button
                      key={x.k}
                      type="button"
                      onClick={() => set('tipoHome', x.k)}
                      className={[
                        'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition',
                        active ? 'bg-[#001f3f] text-white shadow' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {x.label}
                    </button>
                  );
                })}
              </div>
            </ParametroField>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ParametroField label="Imagen única home (archivo)">
            <ParametroTextInput value={d.imagenUnicaHome ?? ''} onChange={(v) => set('imagenUnicaHome', v)} />
          </ParametroField>
          <ParametroField label="Path imágenes default">
            <ParametroTextInput value={d.pathImagenesDefault ?? ''} onChange={(v) => set('pathImagenesDefault', v)} />
          </ParametroField>
          <ParametroField label="Path imágenes home">
            <ParametroTextInput value={d.pathImagenesHome ?? ''} onChange={(v) => set('pathImagenesHome', v)} />
          </ParametroField>
          <ParametroField label="Path imágenes principal">
            <ParametroTextInput value={d.pathImagenesPrincipal ?? ''} onChange={(v) => set('pathImagenesPrincipal', v)} />
          </ParametroField>
          <ParametroField label="Link revista Exclusivo Motos">
            <ParametroTextInput value={d.linkRevistaEM ?? ''} onChange={(v) => set('linkRevistaEM', v)} />
          </ParametroField>
          <ParametroField label="Path upload">
            <ParametroTextInput value={d.pathUpload ?? ''} onChange={(v) => set('pathUpload', v)} />
          </ParametroField>
        </div>

        <ParametroField label="Mensaje de mantenimiento / actualizaciones">
          <textarea
            value={d.mensajeMantenimiento ?? ''}
            onChange={(e) => set('mensajeMantenimiento', e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm focus:border-[#0e8c85] focus:outline-none focus:ring-1 focus:ring-[#0e8c85]/30"
          />
        </ParametroField>
      </div>

      <div className="mt-8 flex justify-end border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={guardar}
          disabled={saving}
          className="rounded-xl bg-[#0e8c85] px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

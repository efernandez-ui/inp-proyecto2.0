'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getParametrosBanners,
  putParametrosBanners,
  type ParametroBannerRow,
  type ParametroBannersPayload,
  type ParametroPopupRow,
} from '@/services/admin';
import {
  ParametroTextInput,
  PARAMETRO_CONTROL_CLASS,
  PARAMETRO_TEXTAREA_CLASS,
} from '@/components/admin/parametros/ParametroField';
import { ParametroImageUpload } from '@/components/admin/parametros/ParametroImageUpload';
import { ParametroS3ImagePreview } from '@/components/admin/parametros/ParametroS3ImagePreview';
import { SnSwitch } from '@/components/admin/parametros/SnSwitch';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';

function toLocalDatetimeValue(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeValue(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const ms = new Date(t).getTime();
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export default function ParametrosBannersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popups, setPopups] = useState<ParametroPopupRow[]>([]);
  const [homeBanners, setHomeBanners] = useState<ParametroBannerRow[]>([]);
  /** Fecha popup por índice de fila (evita desincronizar si cambia el orden). */
  const [popupDates, setPopupDates] = useState<string[]>([]);

  useEffect(() => {
    let c = false;
    setLoading(true);
    getParametrosBanners()
      .then((p: ParametroBannersPayload) => {
        if (c) return;
        const pp = p.popups || [];
        setPopups(pp);
        setPopupDates(pp.map((x) => toLocalDatetimeValue(x.fechaHasta)));
        setHomeBanners(p.homeBanners || []);
      })
      .catch(() => toast.error('No se pudieron cargar banners'))
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  const nextPopupOrden = useMemo(() => (popups.length ? Math.max(...popups.map((p) => p.orden)) + 1 : 1), [popups]);
  const nextBannerOrden = useMemo(
    () => (homeBanners.length ? Math.max(...homeBanners.map((p) => p.orden)) + 1 : 1),
    [homeBanners]
  );

  const guardar = async () => {
    const popupsOut = popups.map((r, idx) => ({
      ...r,
      fechaHasta: fromLocalDatetimeValue(popupDates[idx] ?? '') ?? null,
    }));
    setSaving(true);
    try {
      const saved = await putParametrosBanners({ popups: popupsOut, homeBanners });
      const pp = saved.popups || [];
      setPopups(pp);
      setPopupDates(pp.map((x) => toLocalDatetimeValue(x.fechaHasta)));
      setHomeBanners(saved.homeBanners || []);
      toast.success('Banners guardados');
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
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#001f3f]">Popups</h2>
          <button
            type="button"
            onClick={() => {
              setPopups((list) => [...list, { orden: nextPopupOrden, descripcion: '', pathImagen: '', activo: 'N' }]);
              setPopupDates((d) => [...d, '']);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#001f3f] px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Fila
          </button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-[920px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-3 py-2">Orden</th>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Descripción</th>
                <th className="px-3 py-2">Path imagen</th>
                <th className="px-3 py-2">Link</th>
                <th className="px-3 py-2">Vigencia hasta</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {popups.map((r, idx) => (
                <tr key={`${idx}-${r.orden}`} className="border-t border-gray-100">
                  <td className="px-3 py-2 align-middle">
                    <input
                      type="number"
                      className={`w-16 ${PARAMETRO_CONTROL_CLASS}`}
                      value={r.orden}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10) || 0;
                        setPopups((list) => list.map((x) => (x === r ? { ...x, orden: n } : x)));
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <SnSwitch value={r.activo} onChange={(v) => setPopups((list) => list.map((x) => (x === r ? { ...x, activo: v } : x)))} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <select
                      className={PARAMETRO_CONTROL_CLASS}
                      value={r.tipoBanner ?? ''}
                      onChange={(e) =>
                        setPopups((list) => list.map((x) => (x === r ? { ...x, tipoBanner: e.target.value || null } : x)))
                      }
                    >
                      <option value="">—</option>
                      <option value="LI">Link interno</option>
                      <option value="LE">Link externo</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <ParametroTextInput value={r.descripcion ?? ''} onChange={(v) => setPopups((list) => list.map((x) => (x === r ? { ...x, descripcion: v } : x)))} />
                  </td>
                  <td className="px-3 py-2 align-middle min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <ParametroS3ImagePreview path={r.pathImagen ?? ''} folder="popups" size={44} />
                      <div className="min-w-0 flex-1">
                        <ParametroTextInput
                          value={r.pathImagen ?? ''}
                          onChange={(v) => setPopups((list) => list.map((x) => (x === r ? { ...x, pathImagen: v } : x)))}
                        />
                      </div>
                      <ParametroImageUpload
                        folder="popups"
                        onUploaded={(fileName) =>
                          setPopups((list) => list.map((x) => (x === r ? { ...x, pathImagen: fileName } : x)))
                        }
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle min-w-[180px]">
                    <textarea
                      className={PARAMETRO_TEXTAREA_CLASS}
                      value={r.link ?? ''}
                      onChange={(e) => setPopups((list) => list.map((x) => (x === r ? { ...x, link: e.target.value } : x)))}
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <input
                      type="datetime-local"
                      className={PARAMETRO_CONTROL_CLASS}
                      value={popupDates[idx] ?? ''}
                      onChange={(e) =>
                        setPopupDates((arr) => {
                          const next = [...arr];
                          next[idx] = e.target.value;
                          return next;
                        })
                      }
                    />
                  </td>
                  <td className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      aria-label="Eliminar fila"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setPopups((list) => list.filter((x) => x !== r));
                        setPopupDates((arr) => arr.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#001f3f]">Banners home</h2>
          <button
            type="button"
            onClick={() =>
              setHomeBanners((list) => [
                ...list,
                { orden: nextBannerOrden, descripcion: '', pathImagen: '', activo: 'N' },
              ])
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#001f3f] px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Fila
          </button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-3 py-2">Orden</th>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Descripción</th>
                <th className="px-3 py-2">Path imagen</th>
                <th className="px-3 py-2">Link</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {homeBanners.map((r) => (
                <tr key={r.orden} className="border-t border-gray-100">
                  <td className="px-3 py-2 align-middle">
                    <input
                      type="number"
                      className={`w-16 ${PARAMETRO_CONTROL_CLASS}`}
                      value={r.orden}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10) || 0;
                        setHomeBanners((list) => list.map((x) => (x === r ? { ...x, orden: n } : x)));
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <SnSwitch
                      value={r.activo}
                      onChange={(v) => setHomeBanners((list) => list.map((x) => (x === r ? { ...x, activo: v } : x)))}
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <select
                      className={PARAMETRO_CONTROL_CLASS}
                      value={r.tipoBanner ?? ''}
                      onChange={(e) =>
                        setHomeBanners((list) =>
                          list.map((x) => (x === r ? { ...x, tipoBanner: e.target.value || null } : x))
                        )
                      }
                    >
                      <option value="">—</option>
                      <option value="IN">Información</option>
                      <option value="LI">Link interno</option>
                      <option value="LE">Link externo</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <ParametroTextInput
                      value={r.descripcion ?? ''}
                      onChange={(v) => setHomeBanners((list) => list.map((x) => (x === r ? { ...x, descripcion: v } : x)))}
                    />
                  </td>
                  <td className="px-3 py-2 align-middle min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <ParametroS3ImagePreview path={r.pathImagen ?? ''} folder="banners" size={44} />
                      <div className="min-w-0 flex-1">
                        <ParametroTextInput
                          value={r.pathImagen ?? ''}
                          onChange={(v) => setHomeBanners((list) => list.map((x) => (x === r ? { ...x, pathImagen: v } : x)))}
                        />
                      </div>
                      <ParametroImageUpload
                        folder="banners"
                        onUploaded={(fileName) =>
                          setHomeBanners((list) => list.map((x) => (x === r ? { ...x, pathImagen: fileName } : x)))
                        }
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle min-w-[180px]">
                    <textarea
                      className={PARAMETRO_TEXTAREA_CLASS}
                      value={r.link ?? ''}
                      onChange={(e) =>
                        setHomeBanners((list) => list.map((x) => (x === r ? { ...x, link: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      aria-label="Eliminar fila"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      onClick={() => setHomeBanners((list) => list.filter((x) => x !== r))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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

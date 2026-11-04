'use client';

import { useEffect, useState } from 'react';
import { getParametrosCarritos, putParametrosCarritos, type ParametroCarritosPayload } from '@/services/admin';
import { ParametroField, ParametroTextInput } from '@/components/admin/parametros/ParametroField';
import { SnSwitch } from '@/components/admin/parametros/SnSwitch';
import { toast } from 'react-toastify';

export default function ParametrosCarritosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<ParametroCarritosPayload>({});
  const [descStr, setDescStr] = useState('');

  useEffect(() => {
    let c = false;
    setLoading(true);
    getParametrosCarritos()
      .then((p) => {
        if (!c) {
          setD(p);
          const raw = p.descuentoJuegoGanador;
          setDescStr(raw === null || raw === undefined ? '' : String(raw));
        }
      })
      .catch(() => toast.error('No se pudo cargar'))
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  const guardar = async () => {
    setSaving(true);
    try {
      const normalized = descStr.trim().replace(',', '.');
      const descNum = normalized === '' ? NaN : Number(normalized);
      const desc = Number.isFinite(descNum) ? descNum : null;
      const saved = await putParametrosCarritos({
        ...d,
        descuentoJuegoGanador: desc,
      });
      setD(saved);
      const raw = saved.descuentoJuegoGanador;
      setDescStr(raw === null || raw === undefined ? '' : String(raw));
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
      <div className="mt-8 max-w-lg space-y-6">
        <ParametroField label="Cantidad máxima de ítems">
          <input
            type="number"
            min={1}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 shadow-sm"
            value={d.cantidadMaximaItem ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setD((prev) => ({
                ...prev,
                cantidadMaximaItem: v === '' ? null : parseInt(v, 10),
              }));
            }}
          />
        </ParametroField>

        <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Envía confirmación carrito por e-mail</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">
              {(d.enviaNotificaciones || 'N').toUpperCase() === 'S' ? 'Sí' : 'No'}
            </span>
            <SnSwitch
              value={d.enviaNotificaciones}
              onChange={(v) => setD((prev) => ({ ...prev, enviaNotificaciones: v }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tragamonedas activo</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">
              {(d.tragamonedaActivo || 'N').toUpperCase() === 'S' ? 'Sí' : 'No'}
            </span>
            <SnSwitch
              value={d.tragamonedaActivo}
              onChange={(v) => setD((prev) => ({ ...prev, tragamonedaActivo: v }))}
            />
          </div>
        </div>

        <ParametroField label="Descuento juego ganador" hint="Decimal">
          <ParametroTextInput value={descStr} onChange={setDescStr} />
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

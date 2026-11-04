'use client';

import { useEffect, useState } from 'react';
import { getParametrosSolicitudCliente, putParametrosSolicitudCliente } from '@/services/admin';
import { ParametroField } from '@/components/admin/parametros/ParametroField';
import { toast } from 'react-toastify';

export default function ParametrosSolicitudClientePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [html, setHtml] = useState('');

  useEffect(() => {
    let c = false;
    setLoading(true);
    getParametrosSolicitudCliente()
      .then((p) => {
        if (!c) setHtml(p.plantillaSolicitudCliente ?? '');
      })
      .catch(() => toast.error('No se pudo cargar la plantilla'))
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
      const saved = await putParametrosSolicitudCliente({ plantillaSolicitudCliente: html });
      setHtml(saved.plantillaSolicitudCliente ?? '');
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
      <p className="text-sm font-medium text-gray-600">
        Plantilla HTML del envío de solicitud de clientes (columna <code className="text-xs">USR_TVCONF_PSOLCL</code> si existe en
        la base).
      </p>
      <div className="mt-6">
        <ParametroField label="Plantilla" hint="HTML">
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={16}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm text-gray-800 shadow-sm focus:border-[#0e8c85] focus:outline-none focus:ring-1 focus:ring-[#0e8c85]/30"
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

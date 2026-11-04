'use client';

import { useEffect, useState } from 'react';
import {
  getParametrosNotificaciones,
  postParametrosNotificacionesPruebaHtml,
  putParametrosNotificaciones,
  type ParametroNotificacionesPayload,
} from '@/services/admin';
import { ParametroField, ParametroTextInput } from '@/components/admin/parametros/ParametroField';
import { toast } from 'react-toastify';
import { Mail } from 'lucide-react';

export default function ParametrosNotificacionesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [d, setD] = useState<ParametroNotificacionesPayload>({});
  const [passwordNew, setPasswordNew] = useState('');

  useEffect(() => {
    let c = false;
    setLoading(true);
    getParametrosNotificaciones()
      .then((p) => {
        if (!c) {
          setD(p);
          setPasswordNew('');
        }
      })
      .catch(() => toast.error('No se pudo cargar la sección'))
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  const set = (k: keyof ParametroNotificacionesPayload, v: string | null | undefined) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const guardar = async () => {
    setSaving(true);
    try {
      const payload: ParametroNotificacionesPayload = { ...d };
      if (passwordNew.trim()) {
        payload.smtpPassword = passwordNew.trim();
      } else {
        delete payload.smtpPassword;
      }
      const saved = await putParametrosNotificaciones(payload);
      setD(saved);
      setPasswordNew('');
      toast.success('Guardado');
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const prueba = async () => {
    setSending(true);
    try {
      await postParametrosNotificacionesPruebaHtml();
      toast.success('Correo de prueba enviado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-sm font-bold text-gray-500">Cargando…</div>;
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-600">
        WhatsApp, SMTP, destinos y plantilla de notificaciones. La prueba HTML usa el mail configurado en{' '}
        <strong>recepción modo prueba</strong>.
      </p>

      <section className="mt-8 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-[#f6f8fb] p-5">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#0e8c85]">WhatsApp</h2>
        <div className="mt-4 max-w-xl">
          <ParametroField label="URL de mensajes">
            <ParametroTextInput value={d.urlWhatsapp ?? ''} onChange={(v) => set('urlWhatsapp', v)} />
          </ParametroField>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Cuenta SMTP</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <ParametroField label="Nombre de la cuenta">
            <ParametroTextInput value={d.smtpNombreCuenta ?? ''} onChange={(v) => set('smtpNombreCuenta', v)} />
          </ParametroField>
          <ParametroField label="Usuario">
            <ParametroTextInput value={d.smtpUsuario ?? ''} onChange={(v) => set('smtpUsuario', v)} />
          </ParametroField>
          <ParametroField label="Password (solo si cambia)">
            <ParametroTextInput value={passwordNew} onChange={setPasswordNew} type="password" placeholder="••••••••" />
          </ParametroField>
          <ParametroField label="Puerto">
            <ParametroTextInput value={d.smtpPuerto ?? ''} onChange={(v) => set('smtpPuerto', v)} />
          </ParametroField>
          <ParametroField label="StartTLS (true/false o S/N)">
            <ParametroTextInput value={d.smtpStarttls ?? ''} onChange={(v) => set('smtpStarttls', v)} />
          </ParametroField>
          <ParametroField label="Autorización SMTP">
            <ParametroTextInput value={d.smtpAuth ?? ''} onChange={(v) => set('smtpAuth', v)} />
          </ParametroField>
          <ParametroField label="Host SMTP">
            <ParametroTextInput value={d.smtpHost ?? ''} onChange={(v) => set('smtpHost', v)} />
          </ParametroField>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 md:col-span-2">
            <ParametroField label="Tipo SMTP">
              <div className="mt-2 flex flex-wrap gap-2">
                {(['smtp', 'smtps'] as const).map((x) => {
                  const active = (d.smtpTipo || '').toLowerCase() === x;
                  return (
                    <button
                      key={x}
                      type="button"
                      onClick={() => set('smtpTipo', x)}
                      className={[
                        'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition',
                        active ? 'bg-[#001f3f] text-white shadow' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {x === 'smtp' ? 'SMTP' : 'SMTP seguro'}
                    </button>
                  );
                })}
              </div>
            </ParametroField>
          </div>
          <ParametroField label="Dirección de envío (from)">
            <ParametroTextInput value={d.smtpDireccionEnvio ?? ''} onChange={(v) => set('smtpDireccionEnvio', v)} />
          </ParametroField>
          <ParametroField label="Nombre de envío (from)">
            <ParametroTextInput value={d.smtpNombreEnvio ?? ''} onChange={(v) => set('smtpNombreEnvio', v)} />
          </ParametroField>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={prueba}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#001f3f] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white hover:brightness-110 disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {sending ? 'Enviando…' : 'Envío prueba HTML'}
          </button>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-amber-100 bg-amber-50/40 p-4 text-sm text-amber-950">
        <strong>Atención:</strong> varias direcciones de correo separadas con <code className="font-mono text-xs">;</code>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ParametroField label="E-mail recepción notificaciones de consulta">
          <ParametroTextInput value={d.emailRecepcionConsulta ?? ''} onChange={(v) => set('emailRecepcionConsulta', v)} />
        </ParametroField>
        <ParametroField label="E-mail recepción notificaciones V.Esp.">
          <ParametroTextInput value={d.correoElectronicoPool ?? ''} onChange={(v) => set('correoElectronicoPool', v)} />
        </ParametroField>
        <ParametroField label="E-mail recepción notificaciones modo prueba" hint="Destino del botón de prueba">
          <ParametroTextInput
            value={d.recepcionNotificacionModoPrueba ?? ''}
            onChange={(v) => set('recepcionNotificacionModoPrueba', v)}
          />
        </ParametroField>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-black text-[#001f3f]">Plantilla envío notificaciones</h2>
        <textarea
          value={d.plantillaNotificaciones ?? ''}
          onChange={(e) => set('plantillaNotificaciones', e.target.value)}
          rows={14}
          className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm text-gray-800 shadow-sm focus:border-[#0e8c85] focus:outline-none focus:ring-1 focus:ring-[#0e8c85]/30"
        />
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

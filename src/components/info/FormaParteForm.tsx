'use client';

import { FormEvent, useRef, useState } from 'react';
import { Check, Loader2, Send, Smile, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { readApiErrorMessage } from '@/utils/apiError';

const API = process.env.NEXT_PUBLIC_API_BACKEND || '';

const fieldClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-[#111c39] outline-none transition placeholder:text-slate-400 focus:border-[#1a79ff] focus:ring-2 focus:ring-[#1a79ff]/15';

type FormState = {
  nombre: string;
  telefono: string;
  cuit: string;
  celular: string;
  provincia: string;
  email: string;
  ciudad: string;
  direccion: string;
  mensaje: string;
};

const EMPTY: FormState = {
  nombre: '',
  telefono: '',
  cuit: '',
  celular: '',
  provincia: '',
  email: '',
  ciudad: '',
  direccion: '',
  mensaje: '',
};

export default function FormaParteForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [cv, setCv] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onFileChange = (file: File | null) => {
    if (!file) {
      setCv(null);
      return;
    }
    const lower = file.name.toLowerCase();
    if (!(lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx'))) {
      toast.error('El CV debe ser PDF, DOC o DOCX');
      return;
    }
    if (file.size > 5_000_000) {
      toast.error('El CV no debe superar los 5 MB');
      return;
    }
    setCv(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cv) {
      toast.error('Debe adjuntar su Curriculum Vitae');
      return;
    }
    setSending(true);
    setDone(false);
    try {
      const body = new FormData();
      body.append('nombre', form.nombre.trim());
      body.append('cuit', form.cuit.trim());
      body.append('ciudad', form.ciudad.trim());
      body.append('provincia', form.provincia.trim());
      body.append('celular', form.celular.trim());
      body.append('email', form.email.trim());
      body.append('mensaje', form.mensaje.trim());
      if (form.telefono.trim()) body.append('telefono', form.telefono.trim());
      if (form.direccion.trim()) body.append('direccion', form.direccion.trim());
      body.append('cv', cv);

      const res = await fetch(`${API}/api/public/forma-parte`, {
        method: 'POST',
        body,
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'No se pudo enviar la postulación'));
      }
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      toast.success(data?.message || 'Hemos recibido su CV. Muchas gracias.');
      setForm(EMPTY);
      setCv(null);
      if (fileRef.current) fileRef.current.value = '';
      setDone(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <section>
      <header className="flex items-start gap-3 border-b border-slate-200 pb-5">
        <Smile className="mt-1 h-7 w-7 shrink-0 text-[#1a79ff]" aria-hidden />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111c39] sm:text-3xl">
            Jugá en nuestro equipo
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Envianos tus datos y CV.</p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mt-8">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className={fieldClass}
            name="nombre"
            placeholder="Nombre y Apellido *"
            required
            value={form.nombre}
            onChange={(e) => setField('nombre', e.target.value)}
          />
          <input
            className={fieldClass}
            name="telefono"
            type="tel"
            placeholder="Teléfono fijo"
            value={form.telefono}
            onChange={(e) => setField('telefono', e.target.value)}
          />
          <input
            className={fieldClass}
            name="cuit"
            inputMode="numeric"
            placeholder="DNI/CUIL * (sin guiones, puntos o espacios)"
            required
            value={form.cuit}
            onChange={(e) => setField('cuit', e.target.value)}
          />
          <input
            className={fieldClass}
            name="celular"
            type="tel"
            placeholder="Teléfono celular *"
            required
            value={form.celular}
            onChange={(e) => setField('celular', e.target.value)}
          />
          <input
            className={fieldClass}
            name="provincia"
            placeholder="Provincia *"
            required
            value={form.provincia}
            onChange={(e) => setField('provincia', e.target.value)}
          />
          <input
            className={fieldClass}
            name="email"
            type="email"
            placeholder="E-mail *"
            required
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
          />
          <input
            className={fieldClass}
            name="ciudad"
            placeholder="Ciudad *"
            required
            value={form.ciudad}
            onChange={(e) => setField('ciudad', e.target.value)}
          />
          <input
            className={fieldClass}
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) => setField('direccion', e.target.value)}
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />

        {!cv ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-left text-sm text-slate-600 transition hover:border-[#1a79ff]/50 hover:bg-slate-100"
          >
            <span className="rounded-md bg-[#1a79ff] px-3 py-1.5 font-bold text-white">Buscar C.V.</span>
            <span>Adjuntá tu currículum</span>
          </button>
        ) : (
          <div className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm">
            <p className="flex min-w-0 items-center gap-2 font-medium text-emerald-800">
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{cv.name}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setCv(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-600 hover:underline"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Eliminar
            </button>
          </div>
        )}

        <textarea
          className="mt-4 min-h-[185px] w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-[#111c39] outline-none transition placeholder:text-slate-400 focus:border-[#1a79ff] focus:ring-2 focus:ring-[#1a79ff]/15"
          name="mensaje"
          placeholder="Nota de presentación *"
          required
          value={form.mensaje}
          onChange={(e) => setField('mensaje', e.target.value)}
        />

        <p className="mt-4 border-b border-slate-200 px-2 pb-2 text-sm text-slate-600">
          Los campos marcados con un asterisco (*) son necesarios.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1a79ff] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#111c39] disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Enviando…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden />
                Enviar datos
              </>
            )}
          </button>
          {done && (
            <p role="status" className="text-sm font-medium text-emerald-700">
              Hemos recibido tu perfil laboral. Te contactaremos a la brevedad.
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

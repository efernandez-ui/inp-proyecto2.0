'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import type { RootState } from '@/store';
import { changePassword, getProfile, type User } from '@/services/auth';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="border-b border-gray-100 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#001f3f]">{value}</dd>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-500 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-lg border border-gray-200 px-3 pr-10 text-sm text-[#001f3f] outline-none focus:border-[#93B931]"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-[#001f3f]"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function MisDatosPage() {
  const router = useRouter();
  const { isLoggedIn, user: storeUser } = useSelector((s: RootState) => s.auth);
  const [profile, setProfile] = useState<User | null>(storeUser);
  const [loading, setLoading] = useState(true);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/?login=1');
      return;
    }
    getProfile()
      .then(setProfile)
      .catch(() => setProfile(storeUser))
      .finally(() => setLoading(false));
  }, [isLoggedIn, router, storeUser]);

  const onSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevaPassword.trim()) {
      toast.error('Ingresá la nueva contraseña');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      await changePassword(nuevaPassword, confirmarPassword);
      toast.success('Contraseña actualizada. Te enviamos un mail con la nueva clave.');
      setNuevaPassword('');
      setConfirmarPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#001f3f] mb-6">Mi perfil</h1>
      {loading ? (
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <dl className="bg-white rounded-xl shadow-sm border border-gray-100 px-5">
            <Field label="Usuario" value={profile?.nombre} />
            <Field label="Cliente" value={profile?.nrocta} />
            <Field label="CUIT" value={profile?.cuit} />
            <Field label="Tipo" value={profile?.descripcionTipo} />
            <Field label="Correo electrónico" value={profile?.correoElectronico} />
            <Field label="Último acceso" value={profile?.ultimoAcceso} />
          </dl>

          <form
            onSubmit={(e) => void onSubmitPassword(e)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-5 space-y-4"
          >
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#001f3f]">
              Cambiar contraseña
            </h2>
            <p className="text-xs text-gray-500">
              Al guardar se envía un mail a tu correo con la nueva contraseña.
            </p>
            <PasswordInput
              id="nueva-password"
              label="Nueva contraseña"
              value={nuevaPassword}
              onChange={setNuevaPassword}
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirmar-password"
              label="Confirmar contraseña"
              value={confirmarPassword}
              onChange={setConfirmarPassword}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-lg bg-[#001f3f] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

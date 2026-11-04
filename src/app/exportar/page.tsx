'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import DescargarPreciosModal from '@/components/catalog/DescargarPreciosModal';
import { isStaff } from '@/utils/auth';
import { toast } from 'react-toastify';

/**
 * Misma descarga que el botón del catálogo (ExportadorBean).
 * Abre el modal de Descargar precios; la selección de filtros
 * se toma de la URL si venís del catálogo, o catálogo completo por defecto.
 */
const ExportarPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, user, selectedClient } = useSelector((s: RootState) => s.auth);
  const [authReady, setAuthReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const nrocta = useMemo(() => {
    if (isStaff(user)) return (selectedClient?.nrocta || '').trim();
    return (user?.nrocta || selectedClient?.nrocta || '').trim();
  }, [user, selectedClient]);

  const clienteNombre = useMemo(() => {
    if (isStaff(user)) {
      return (selectedClient as any)?.nombre || selectedClient?.nrocta || '';
    }
    return (
      (user as any)?.nombreCliente ||
      (user as any)?.nombre ||
      (selectedClient as any)?.nombre ||
      user?.nrocta ||
      ''
    );
  }, [user, selectedClient]);

  const emptyParams = useMemo(() => new URLSearchParams(), []);

  useEffect(() => {
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!isLoggedIn || !token) {
      router.replace('/?login=1');
      return;
    }
    if (!nrocta) {
      toast.warning('Por favor seleccione un cliente para descargar un catálogo');
      return;
    }
    setModalOpen(true);
  }, [authReady, isLoggedIn, nrocta, router]);

  if (!authReady || !isLoggedIn) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500">
        Redirigiendo…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <header className="bg-[#001f3f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-5 flex items-center gap-4">
          <Image
            src="/images/Intercap-Blanco.png"
            alt="Intercap"
            width={140}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
          <div className="border-l border-white/25 pl-4">
            <h1 className="text-lg font-semibold tracking-wide">Exportar catálogo</h1>
            <p className="text-xs text-white/70">
              Misma descarga que &quot;Descargar precios&quot; del catálogo
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-4">
        <p className="text-sm text-gray-600">
          {nrocta
            ? 'Usá el diálogo para elegir moneda, alcance (completo) y formato.'
            : 'Seleccioná un cliente (menú superior) para poder exportar.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (!nrocta) {
                toast.warning('Por favor seleccione un cliente para descargar un catálogo');
                return;
              }
              setModalOpen(true);
            }}
            className="bg-[#0e8c85] hover:brightness-110 text-white text-sm font-bold px-4 py-2"
          >
            Abrir descarga
          </button>
          <button
            type="button"
            onClick={() => router.push('/catalogo')}
            className="text-sm font-semibold text-[#001f3f] underline"
          >
            Ir al catálogo (con filtros)
          </button>
        </div>
      </main>

      <DescargarPreciosModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        searchParams={emptyParams}
        nrocta={nrocta}
        clienteNombre={clienteNombre}
        markupPercentage={0}
        defaultDatos="C"
      />
    </div>
  );
};

export default ExportarPage;

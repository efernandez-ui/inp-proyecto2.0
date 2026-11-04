'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useSelector } from 'react-redux';
import Modal from '@/components/modals/Modal';
import Bitrix24InlineForm from '@/components/bitrix/Bitrix24InlineForm';
import { BITRIX24_FORMS, type Bitrix24FormKey } from '@/config/bitrix24Forms';
import type { RootState } from '@/store';
import { getClients } from '@/services/auth';
import { isStaff } from '@/utils/auth';

type Props = {
  formKey: Bitrix24FormKey | null;
  isOpen: boolean;
  onClose: () => void;
  contentClassName?: string;
};

function normalizeCuit(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  return t || undefined;
}

type CuitResolveState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; cuit: string | undefined }
  | { status: 'need_client' };

export default function Bitrix24FormModal({
  formKey,
  isOpen,
  onClose,
  contentClassName = 'w-full max-w-[420px] rounded-2xl bg-white shadow-xl overflow-hidden',
}: Props) {
  const [cuitState, setCuitState] = useState<CuitResolveState>({ status: 'idle' });
  const { user, selectedClient } = useSelector((s: RootState) => s.auth);

  const needsCuitPrefill = formKey === 'sugerenciasReclamos';

  const immediateCuit = useMemo(() => {
    if (!needsCuitPrefill) return undefined;
    if (isStaff(user)) {
      return normalizeCuit(selectedClient?.cuit);
    }
    return normalizeCuit(user?.cuit);
  }, [needsCuitPrefill, user, selectedClient]);

  useEffect(() => {
    if (!isOpen || !formKey) {
      setCuitState({ status: 'idle' });
      return;
    }

    if (!needsCuitPrefill) {
      setCuitState({ status: 'ready', cuit: undefined });
      return;
    }

    // Staff sin cliente: pedir selección antes de montar Bitrix.
    if (isStaff(user) && !selectedClient?.nrocta) {
      setCuitState({ status: 'need_client' });
      return;
    }

    if (immediateCuit) {
      setCuitState({ status: 'ready', cuit: immediateCuit });
      return;
    }

    // Staff con cliente pero CUIT ausente en localStorage: resolver vía /clients.
    if (isStaff(user) && selectedClient?.nrocta) {
      let cancelled = false;
      setCuitState({ status: 'loading' });
      getClients()
        .then((clients) => {
          if (cancelled) return;
          const match = clients.find(
            (c) => c.nrocta?.trim() === selectedClient.nrocta?.trim(),
          );
          setCuitState({ status: 'ready', cuit: normalizeCuit(match?.cuit) });
        })
        .catch(() => {
          if (!cancelled) setCuitState({ status: 'ready', cuit: undefined });
        });
      return () => {
        cancelled = true;
      };
    }

    // Cliente/prospecto sin CUIT en sesión: montar igual (sin prefill).
    setCuitState({ status: 'ready', cuit: undefined });
  }, [isOpen, formKey, needsCuitPrefill, immediateCuit, user, selectedClient?.nrocta]);

  if (!formKey) return null;

  const { title } = BITRIX24_FORMS[formKey];
  const canMountForm =
    cuitState.status === 'ready' || (!needsCuitPrefill && cuitState.status !== 'need_client');
  const prefillCuit =
    needsCuitPrefill && cuitState.status === 'ready' ? cuitState.cuit : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} contentClassName={contentClassName}>
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-[#001f3f]">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[min(85vh,720px)] overflow-y-auto p-4">
        {cuitState.status === 'need_client' && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Seleccioná un cliente en la barra superior para cargar el CUIT en el formulario de
            reclamos.
          </p>
        )}
        {cuitState.status === 'loading' && (
          <p className="text-sm text-gray-500">Cargando datos del cliente…</p>
        )}
        {canMountForm && cuitState.status === 'ready' && (
          <Bitrix24InlineForm formKey={formKey} prefillCuit={prefillCuit} />
        )}
      </div>
    </Modal>
  );
}

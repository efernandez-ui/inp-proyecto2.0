'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { isStaff } from '@/utils/auth';

const BOTMAKER_SRC = 'https://go.botmaker.com/rest/webchat/p/EE73DRN3NL/init.js';

type BotmakerVar = {
  cuit: string;
  user_log_in: boolean;
  user_log_in_name: string;
};

declare global {
  interface Window {
    BOTMAKER_VAR?: BotmakerVar;
  }
}

/** Identidad con la que se inicializó el widget en esta carga de página. */
let loadedKey: string | null = null;

/**
 * Webchat de Botmaker en todo el sitio, con o sin sesión.
 * Cliente: cuit + razón social. Staff (V/A/S/B): nombre de usuario y cuit vacío. Sin sesión: todo vacío.
 */
export default function BotmakerWebchat() {
  const { user, isLoggedIn, isLoading } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (isLoading) return;

    const config: BotmakerVar = !isLoggedIn || !user
      ? { cuit: '', user_log_in: false, user_log_in_name: '' }
      : isStaff(user)
        ? { cuit: '', user_log_in: true, user_log_in_name: (user.nombre ?? '').trim() }
        : {
            cuit: user.cuit?.trim() ?? '',
            user_log_in: true,
            user_log_in_name: (user.razonSocial ?? user.nombre ?? '').trim(),
          };

    const key = JSON.stringify(config);
    if (loadedKey === null) {
      window.BOTMAKER_VAR = config;
      const js = document.createElement('script');
      js.type = 'text/javascript';
      js.async = true;
      js.src = BOTMAKER_SRC;
      document.body.appendChild(js);
      loadedKey = key;
      return;
    }

    // El widget no se puede reinicializar: si cambia la sesión (login/logout) recargamos
    // para que tome la identidad correcta.
    if (key !== loadedKey) window.location.reload();
  }, [user, isLoggedIn, isLoading]);

  return null;
}

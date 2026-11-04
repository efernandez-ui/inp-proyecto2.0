import { toast } from 'react-toastify';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BACKEND}/api`;
const AUTH_COOKIE_NAME = 'auth_token';

export class SessionExpiredError extends Error {
  constructor(message = 'La sesión ha expirado') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class ApiUnavailableError extends Error {
  constructor(message = 'No se pudo conectar con el servidor') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

// Función helper para guardar token en cookie (para Server Components)
const setAuthCookie = (token: string) => {
  // Esta función se llama desde el cliente después del login
  if (typeof document !== 'undefined') {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 días
    document.cookie = `${AUTH_COOKIE_NAME}=${token};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }
};

// Función helper para obtener token de cookie (para Server Components)
export const getAuthTokenFromCookie = (): string | null => {
  if (typeof document !== 'undefined') {
    const name = AUTH_COOKIE_NAME + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  }
  return null;
};
export interface CuentaCorrienteAlertaProfile {
  saldoVencido: number;
  documentosVencidos: number;
}

export interface User {
  nombre: string;
  nrocta: string;
  tipo: string;
  descripcionTipo: string;
  cambiaPassword: string;
  tipoVista: string;
  ultimoAcceso: string;
  correoElectronico: string;
  actualizaCatalogo: string;
  notificaciones: string;
  fecalt: string;
  fecmod: string;
  userid: string;
  ultopr: string;
  oalias: string;
  activo: boolean;
  vendedorId?: string;
  /** Softland VTMCLH_NRODOC (CUIT/CUIL) cuando está disponible. */
  cuit?: string;
  /** Softland VTMCLH_NOMBRE del cliente (nrocta). */
  razonSocial?: string;
  /** S = ver stock real (>50); N/ausente = máscara C/P habitual. */
  verStock?: string | null;
  ccAlerta?: CuentaCorrienteAlertaProfile;
}
export const login = async (username: string, password: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Login failed');
  }
  const data = await response.json();
  const token = data.token;
  if (!token) {
    throw new Error('No token received');
  }
  localStorage.setItem('authToken', token);
  setAuthCookie(token);  // También guardar en cookie para Server Components
  return token;
};
export const register = async (username: string, password: string, email?: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, email }),
  });
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  const data = await response.json();
  const token = data.token;
  if (!token) {
    throw new Error('No token received');
  }
  localStorage.setItem('authToken', token);
  setAuthCookie(token);  // También guardar en cookie para Server Components
  return token;
};
export const getProfile = async (): Promise<User> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new SessionExpiredError();
  }
  try {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      throw new SessionExpiredError();
    }

    if (!response.ok) {
      // Evitar explotar con .json() si viene vacío / HTML / etc.
      throw new Error(`Failed to fetch profile (${response.status})`);
    }

    return await response.json();
  } catch (e: any) {
    // fetch() tira TypeError cuando hay error de red / CORS / backend caído.
    if (e?.name === 'TypeError' && String(e?.message || '').toLowerCase().includes('fetch')) {
      throw new ApiUnavailableError();
    }
    throw e;
  }
};
export const getClients = async (): Promise<User[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token');
  const response = await fetch(`${API_BASE_URL}/profile/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
};

export const changePassword = async (
  nuevaPassword: string,
  confirmarPassword: string,
): Promise<{ mailEnviado: boolean; message: string }> => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new SessionExpiredError();
  const response = await fetch(`${API_BASE_URL}/profile/password`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nuevaPassword, confirmarPassword }),
  });
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    throw new SessionExpiredError();
  }
  if (!response.ok) {
    let message = `No se pudo cambiar la contraseña (${response.status})`;
    try {
      const data = await response.json();
      const raw =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.detail === 'string' && data.detail) ||
        '';
      if (raw.trim()) message = raw.trim();
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const data = await response.json().catch(() => ({}));
  return {
    mailEnviado: data?.mailEnviado === 'true',
    message: typeof data?.message === 'string' ? data.message : 'Su clave ha sido modificada.',
  };
};
export const logout = () => {
  localStorage.removeItem('authToken');
  // También eliminar la cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
  }
};
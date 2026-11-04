import { readApiErrorMessage } from '@/utils/apiError';

const API_BASE = `${process.env.NEXT_PUBLIC_API_BACKEND}/api/informes-pago`;

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function withNrocta(url: string, nrocta?: string) {
  if (!nrocta) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}nrocta=${encodeURIComponent(nrocta)}`;
}

export interface InformePagoItemPayload {
  nroComprobante: string;
  fechaComprobante: string;
  bancoDestino: string;
  formaPago: string;
  plazoAcreditacion: string;
  sucursalDeposito?: string;
  nombreOriginante: string;
  importe: number;
  estado?: string;
  archivoAdjunto?: string;
  nombreArchivoOriginal?: string;
}

export interface InformePagoPayload {
  nroCuenta: string;
  fechaInforme: string;
  usuario?: string;
  notas?: string;
  pagos: InformePagoItemPayload[];
  /** true = el usuario ya confirmó posibles duplicados Mercado Pago. */
  confirmarDuplicados?: boolean;
}

export interface PosibleDuplicadoPago {
  nroTransferencia?: string;
  fecha?: string;
  importe?: number;
  label?: string;
}

export interface InformePagoDuplicadosResponse {
  requiresConfirmation: boolean;
  duplicados: PosibleDuplicadoPago[];
}

export class InformePagoDuplicadosError extends Error {
  duplicados: PosibleDuplicadoPago[];

  constructor(duplicados: PosibleDuplicadoPago[]) {
    super('Posibles duplicados Mercado Pago');
    this.name = 'InformePagoDuplicadosError';
    this.duplicados = duplicados;
  }
}

export interface InformePagoListItem {
  nroCuenta: string;
  fechaInforme: string;
  nroVersion: number;
  usuario?: string;
  notas?: string;
  pagos: InformePagoItemPayload[];
}

export interface ConceptoTesoreria {
  codigoConcepto: string;
  descrip: string;
  tipoConcepto: string;
}

export async function fetchInformesPago(token: string, nrocta?: string): Promise<InformePagoListItem[]> {
  const res = await fetch(withNrocta(API_BASE, nrocta), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar informes de pago'));
  return res.json();
}

export async function fetchCuentasBancarias(token: string, nrocta?: string): Promise<ConceptoTesoreria[]> {
  const res = await fetch(withNrocta(`${API_BASE}/cuentas-bancarias`, nrocta), {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar cuentas bancarias'));
  return res.json();
}

export async function crearInformePago(token: string, payload: InformePagoPayload): Promise<InformePagoListItem> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    let body: InformePagoDuplicadosResponse | null = null;
    try {
      body = (await res.json()) as InformePagoDuplicadosResponse;
    } catch {
      /* ignore */
    }
    if (body?.requiresConfirmation && Array.isArray(body.duplicados) && body.duplicados.length > 0) {
      throw new InformePagoDuplicadosError(body.duplicados);
    }
    throw new Error('Posibles duplicados Mercado Pago');
  }
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al informar pago'));
  return res.json();
}

export async function uploadAdjuntoInformePago(
  token: string,
  file: File,
  nrocta?: string,
): Promise<{ archivoAdjunto: string; nombreArchivoOriginal: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(withNrocta(`${API_BASE}/adjuntos`, nrocta), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al subir el comprobante'));
  return res.json();
}

export const BANCO_LABELS: Record<string, string> = {
  B01CCN: 'Credicoop Cta.Cte. Pesos',
  B02CCN: 'ICBC Cta.Cte. Pesos',
  B03CCN: 'Macro Cta.Cte. Pesos',
  B04CCN: 'Santa Fe C.A. Pesos',
  B05CCN: 'Nación Cta.Cte. Pesos',
  B07CCN: 'Galicia Cta.Cte. Pesos',
  XRETAI: 'Retenciones a Imputar',
  VCN011: 'Valores Diferidos Galicia',
  MERPAG: 'Mercado Pago',
};

export const FORMA_PAGO_LABELS: Record<string, string> = {
  D: 'Depósito de efectivo',
  T: 'Transferencia',
  V: 'Depósito de cheque',
  RIB: 'Retención IIBB',
  RG: 'Retención Ganancia',
  RM: 'Retención Municipal',
  RS: 'Retención SUSS',
  RIV: 'Retención IVA',
};

export const FORMAS_PAGO_OPTIONS = [
  { value: 'T', label: FORMA_PAGO_LABELS.T },
  { value: 'D', label: FORMA_PAGO_LABELS.D },
  { value: 'V', label: FORMA_PAGO_LABELS.V },
  { value: 'RIB', label: FORMA_PAGO_LABELS.RIB },
  { value: 'RG', label: FORMA_PAGO_LABELS.RG },
  { value: 'RM', label: FORMA_PAGO_LABELS.RM },
  { value: 'RS', label: FORMA_PAGO_LABELS.RS },
  { value: 'RIV', label: FORMA_PAGO_LABELS.RIV },
];

export const PLAZO_LABELS: Record<string, string> = {
  I: 'Inmediato',
  D: 'Diferido',
};

export const PLAZO_OPTIONS = [
  { value: 'I', label: PLAZO_LABELS.I },
  { value: 'D', label: PLAZO_LABELS.D },
];

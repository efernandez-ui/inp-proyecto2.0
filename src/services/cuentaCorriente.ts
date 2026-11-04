import { readApiErrorMessage } from '@/utils/apiError';
import { normalizeSpringPage, type SpringPage } from '@/utils/springPage';
import * as XLSX from 'xlsx';

const API_BASE = `${process.env.NEXT_PUBLIC_API_BACKEND}/api/cuenta-corriente`;

export const MOVIMIENTOS_PAGE_SIZE = 13;
/** Paginación client-side de créditos pendientes (legacy PrimeFaces rows=5). */
export const CREDITOS_PAGE_SIZE = 5;
/** Tamaño para exportar Excel (toda la data filtrada, no solo la página visible). */
export const EXPORT_PAGE_SIZE = 10_000;
/** Mismo límite que el legacy: historial de los últimos 2 años. */
export const HISTORIAL_MAX_DIAS = 730;

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

export interface CuentaCorrienteResumen {
  nrocta: string;
  clienteNombre: string;
  saldoActual: number;
  saldoAVencer: number;
  saldoVencido: number;
  /** Débitos pendientes con vencimiento anterior a hoy. */
  documentosVencidos?: number;
  saldoPendienteAplicar: number;
  proximoVencimiento?: string | null;
  canInformarPago: boolean;
  canVerLimiteCredito?: boolean;
  limiteDeCredito?: number | null;
  saldoConsumido?: number | null;
  disponible?: number | null;
  porcentajeConsumo?: number | null;
}

/** Datos mínimos para la campanita de saldo vencido en el header. */
export interface CuentaCorrienteAlerta {
  saldoVencido: number;
  documentosVencidos: number;
}

export interface ValorEnCartera {
  numero: string;
  banco: string;
  categoria: string;
  vencimiento: string;
  importe: number;
  tipo?: 'CARTERA' | 'ENTREGADOS';
}

export type PaginatedResponse<T> = SpringPage<T>;

export type MovimientoCuentaTipo = 'PENDIENTE' | 'HISTORICO' | 'SALDO_ANTERIOR';

/** Movimiento unificado: pendientes o historial. */
export interface MovimientoCuenta {
  id?: string;
  tipo: MovimientoCuentaTipo;
  fecha?: string;
  vencimiento?: string;
  codComprobante?: string;
  numero?: number;
  pendiente?: number;
  diasAlVencimiento?: number;
  estado?: 'VENCIDO' | 'POR_VENCER';
  debe?: number;
  haber?: number;
  saldo?: number;
  comprobante?: string;
  sucursal?: string;
}

/** Crédito/comprobante pendiente de aplicar (pagos a favor del cliente). */
export interface MovimientoPendiente {
  id?: string;
  nrocta?: string;
  vencimiento?: string;
  codComprobante?: string;
  numero?: number;
  cuotas?: number;
  pendiente?: number;
  diasAlVencimiento?: number;
  estado?: 'VENCIDO' | 'POR_VENCER';
  comprobante?: string;
}

export interface FetchMovimientosParams {
  nrocta?: string;
  soloPendientes?: boolean;
  fdesde?: string;
  fhasta?: string;
  page?: number;
  size?: number;
  documento?: string;
}

export async function fetchMovimientos(
  token: string,
  params: FetchMovimientosParams = {},
): Promise<PaginatedResponse<MovimientoCuenta>> {
  const q = new URLSearchParams();
  q.set('soloPendientes', String(params.soloPendientes ?? false));
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? MOVIMIENTOS_PAGE_SIZE));
  if (params.fdesde) q.set('fdesde', params.fdesde);
  if (params.fhasta) q.set('fhasta', params.fhasta);
  if (params.documento?.trim()) q.set('documento', params.documento.trim());
  const res = await fetch(withNrocta(`${API_BASE}/movimientos?${q}`, params.nrocta), {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar movimientos'));
  const raw: unknown = await res.json();
  const page = normalizeSpringPage<MovimientoCuenta>(raw);
  // Respaldo: Spring 3.5 devuelve { content, page: { totalElements, ... } }
  if (page.content.length === 0 && raw && typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.content) && o.content.length > 0) {
      page.content = o.content as MovimientoCuenta[];
      if (!page.totalElements) {
        page.totalElements = page.content.length;
      }
    }
  }
  return page;
}

export async function fetchCreditosPendientes(
  token: string,
  nrocta?: string,
): Promise<MovimientoPendiente[]> {
  const res = await fetch(withNrocta(`${API_BASE}/creditos-pendientes`, nrocta), {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar créditos pendientes'));
  const raw: unknown = await res.json();
  return Array.isArray(raw) ? (raw as MovimientoPendiente[]) : [];
}

export interface DescargaDocumento {
  modfor: string;
  codfor: string;
  nrofor: number;
  fchmov: string;
  sucursal: string;
  cantidadItems: number;
  archivoPdf?: string | null;
  urlPdf?: string | null;
  documentoLabel: string;
}

/** Misma convención que legacy ConsultaPedidosBean.getLinkDescarga */
const S3_COMPROBANTES_BASE =
  process.env.NEXT_PUBLIC_S3_COMPROBANTES_BASE ??
  'https://imagenes-inp-aws.s3.us-east-1.amazonaws.com/Comprobantes_Ventas';

export function comprobantePdfUrl(archivoPdf?: string | null): string | null {
  if (!archivoPdf?.trim()) return null;
  const stem = archivoPdf.trim();
  if (stem.startsWith('http://') || stem.startsWith('https://')) return stem;
  const base = S3_COMPROBANTES_BASE.replace(/\/$/, '');
  return `${base}/${stem}.PDF`;
}

export function resolveDescargaPdfUrl(item: Pick<DescargaDocumento, 'archivoPdf' | 'urlPdf'>): string | null {
  if (item.urlPdf?.trim()) return item.urlPdf.trim();
  return comprobantePdfUrl(item.archivoPdf);
}

export async function fetchResumen(token: string, nrocta?: string): Promise<CuentaCorrienteResumen> {
  const res = await fetch(withNrocta(`${API_BASE}/resumen`, nrocta), {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar resumen'));
  return res.json();
}

export async function fetchAlerta(token: string, nrocta?: string): Promise<CuentaCorrienteAlerta> {
  const res = await fetch(withNrocta(`${API_BASE}/alerta`, nrocta), {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar alerta'));
  return res.json();
}


export async function fetchDescargas(
  token: string,
  params: { nrocta?: string; fdesde?: string; documento?: string; page?: number; size?: number } = {},
): Promise<PaginatedResponse<DescargaDocumento>> {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? MOVIMIENTOS_PAGE_SIZE));
  if (params.fdesde) q.set('fdesde', params.fdesde);
  if (params.documento?.trim()) q.set('documento', params.documento.trim());
  const res = await fetch(withNrocta(`${API_BASE}/descargas?${q}`, params.nrocta), {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar descargas'));
  return normalizeSpringPage<DescargaDocumento>(await res.json());
}

export async function fetchValoresEnCartera(token: string, nrocta?: string): Promise<ValorEnCartera[]> {
  const res = await fetch(withNrocta(`${API_BASE}/valores-en-cartera`, nrocta), {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar crédito documentado'));
  return res.json();
}

export async function fetchValoresEntregados(token: string, nrocta?: string): Promise<ValorEnCartera[]> {
  const res = await fetch(withNrocta(`${API_BASE}/valores-entregados`, nrocta), {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readApiErrorMessage(res, 'Error al cargar valores entregados'));
  return res.json();
}

export function sumImportes(items: Pick<ValorEnCartera, 'importe'>[]): number {
  return items.reduce((acc, item) => {
    const n = typeof item.importe === 'number' ? item.importe : Number(item.importe);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

/** Fecha de vencimiento para UI: dd-MM-yyyy. */
export function formatVencimientoIso(value?: string | number | null): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'string') {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
    const dmy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmy) return value;
  }
  const d = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy}`;
}

/** Nº de cheque sin notación científica (ej. 6.57E7 → 65700000). */
export function formatChequeNumero(value?: string | number | null): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }
  const raw = String(value).trim();
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(raw)) {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.trunc(n).toString();
  }
  if (/^\d+\.0+$/.test(raw)) return raw.replace(/\.0+$/, '');
  return raw;
}

export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(safe);
}

export function formatDate(value?: string | number | null): string {
  if (value == null || value === '') return '—';

  // ISO / yyyy-MM-dd: usar el día de calendario del string (evita corrimiento por timezone)
  if (typeof value === 'string') {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return `${iso[3]}/${iso[2]}/${iso[1]}`;
    }
    // dd-MM-yyyy (formato API de cuenta corriente)
    const dmy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmy) {
      return `${dmy[1]}/${dmy[2]}/${dmy[3]}`;
    }
  }

  const d = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  // Timestamps: preferir UTC para no correr el día de fechas “date-only” a medianoche UTC
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function toApiDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Formato `yyyy-mm-dd` para inputs HTML `type="date"`. */
export function toInputDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function inputDateToApiDate(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Fecha mínima permitida para historial (input HTML `type="date"`). */
export function historialMinInputDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - HISTORIAL_MAX_DIAS);
  return toInputDate(d);
}

export function isHistorialDesdeValido(fDesdeInput: string): boolean {
  return fDesdeInput >= historialMinInputDate();
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Descarga CSV con BOM UTF-8 para que Excel abra bien acentos. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Descarga .xlsx (Excel). */
export function downloadXlsx(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  sheetName = 'Datos',
) {
  const aoa: (string | number)[][] = [
    headers,
    ...rows.map((row) => row.map((cell) => (cell == null ? '' : cell))),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const name = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, name);
}

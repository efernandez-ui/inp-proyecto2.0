import { readApiErrorMessage } from '@/utils/apiError';

const API_BASE = `${process.env.NEXT_PUBLIC_API_BACKEND}/api/pedidos`;

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function withParams(url: string, params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

export type PedidoEtapa =
  | 'RECIBIDO'
  | 'ANALISIS'
  | 'PREPARACION'
  | 'FACTURADO'
  | 'ENVIADO'
  | 'CANCELADO';

export interface PedidoListItem {
  modfor: string;
  codfor: string;
  nrofor: number;
  idVisible: string;
  fecha: string;
  circom?: string;
  etapa: PedidoEtapa;
  etapaLabel: string;
  etapasCompletas: boolean[];
  unidadesPendientes: number;
  mostrarPendientes?: boolean;
}

export const PEDIDOS_PAGE_SIZE = 10;

export interface PedidosListResponse {
  needsClientSelection: boolean;
  pendientesUnidades: number;
  /** SKUs con pendiente > 0 (mismo criterio que home / consolidado). */
  pendientesProductos?: number;
  pedidos: PedidoListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PedidoItem {
  tippro: string;
  artcod: string;
  codigo: string;
  descripcion: string;
  nropar?: string;
  presentacion?: string;
  cantidad: number;
  cantidadPendiente?: number;
  deposito?: string;
  depositoNombre?: string;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoDetalle {
  modfor: string;
  codfor: string;
  nrofor: number;
  idVisible: string;
  fecha: string;
  nrocta: string;
  cliente?: string;
  direccion?: string;
  notas?: string;
  etapa: PedidoEtapa;
  etapaLabel: string;
  unidadesPendientes?: number;
  items: PedidoItem[];
}

export interface PedidoReparto {
  nroReparto?: number;
  fechaReparto?: string;
  codRemito?: string;
  nroRemito?: number;
  fechaRemito?: string;
  sucursal?: string;
  direccionEntrega?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  peso?: number;
  cantidadBultos?: number;
  transporte?: string;
}

export interface PedidoComprobanteItem {
  tippro: string;
  artcod: string;
  codigo: string;
  nropar?: string;
  descripcion: string;
  presentacion?: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  delPedido?: boolean;
}

export interface PedidoComprobanteConcepto {
  descripcion: string;
  importe: number;
}

export interface PedidoComprobante {
  modfor: string;
  codfor: string;
  nrofor: number;
  numero: string;
  tipoLabel: string;
  fecha?: string;
  sucursal?: string;
  nroPedido?: string;
  cliente?: string;
  direccion?: string;
  notas?: string;
  subtotal: number;
  percepcion: number;
  iva: number;
  total: number;
  items: PedidoComprobanteItem[];
  impuestos?: PedidoComprobanteConcepto[];
  percepciones?: PedidoComprobanteConcepto[];
  totales?: PedidoComprobanteConcepto[];
}

export interface PedidoPendienteProducto {
  tippro: string;
  artcod: string;
  descripcion: string;
  nropar?: string;
  cantidad?: number;
  pendiente: number;
  precio: number;
  importeTotal: number;
  deposito?: string;
  depositoNombre?: string;
  modforOrigen?: string;
  codforOrigen?: string;
  nroforOrigen?: number;
  idVisibleOrigen?: string;
}

export async function fetchPedidos(
  token: string,
  nrocta?: string,
  nrofor?: string,
  fechaDesde?: string,
  fechaHasta?: string,
  page = 0,
  size = PEDIDOS_PAGE_SIZE,
): Promise<PedidosListResponse> {
  const res = await fetch(
    withParams(API_BASE, {
      nrocta,
      nrofor,
      fechaDesde,
      fechaHasta,
      page: String(page),
      size: String(size),
    }),
    { headers: authHeaders(token) },
  );
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'No se pudieron cargar los pedidos'));
  }
  return res.json();
}

export type PedidoCircomInstancia =
  | 'ALL'
  | 'PRESUPUESTO'
  | 'ANALISIS'
  | 'PREPARACION'
  | 'FACTURADO';

export async function fetchPedidoDetalle(
  token: string,
  modfor: string,
  codfor: string,
  nrofor: number,
  nrocta?: string,
  etapa?: PedidoEtapa,
  deposito?: string,
  circom?: PedidoCircomInstancia | string,
): Promise<PedidoDetalle> {
  const res = await fetch(
    withParams(`${API_BASE}/${encodeURIComponent(modfor)}/${encodeURIComponent(codfor)}/${nrofor}`, {
      nrocta,
      etapa,
      deposito,
      circom: circom ?? 'ALL',
    }),
    { headers: authHeaders(token) },
  );
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'No se pudo cargar el detalle del pedido'));
  }
  return res.json();
}

export async function fetchPedidoRepartos(
  token: string,
  modfor: string,
  codfor: string,
  nrofor: number,
  nrocta?: string,
): Promise<PedidoReparto[]> {
  const res = await fetch(
    withParams(
      `${API_BASE}/${encodeURIComponent(modfor)}/${encodeURIComponent(codfor)}/${nrofor}/repartos`,
      { nrocta },
    ),
    { headers: authHeaders(token) },
  );
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'No se pudieron cargar los repartos'));
  }
  return res.json();
}

export async function fetchPedidoComprobantes(
  token: string,
  modfor: string,
  codfor: string,
  nrofor: number,
  nrocta?: string,
): Promise<PedidoComprobante[]> {
  const res = await fetch(
    withParams(
      `${API_BASE}/${encodeURIComponent(modfor)}/${encodeURIComponent(codfor)}/${nrofor}/comprobantes`,
      { nrocta },
    ),
    { headers: authHeaders(token) },
  );
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'No se pudieron cargar los comprobantes'));
  }
  return res.json();
}

export async function fetchPendientesProducto(
  token: string,
  nrocta?: string,
  deposito?: string,
): Promise<PedidoPendienteProducto[]> {
  const res = await fetch(
    withParams(`${API_BASE}/pendientes-producto`, { nrocta, deposito }),
    { headers: authHeaders(token) },
  );
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'No se pudieron cargar los no entregados'));
  }
  return res.json();
}

export async function fetchPendientesPorPedido(
  token: string,
  modfor: string,
  codfor: string,
  nrofor: number,
  nrocta?: string,
  deposito?: string,
  circom?: PedidoCircomInstancia | string,
): Promise<PedidoPendienteProducto[]> {
  const res = await fetch(
    withParams(
      `${API_BASE}/${encodeURIComponent(modfor)}/${encodeURIComponent(codfor)}/${nrofor}/pendientes`,
      { nrocta, deposito, circom: circom ?? 'ALL' },
    ),
    { headers: authHeaders(token) },
  );
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'No se pudieron cargar los no entregados del pedido'));
  }
  return res.json();
}

export interface GestionPendienteItem {
  tippro: string;
  artcod: string;
  pendienteOriginal: number;
  cantidadSolicitada?: number;
  modforOrigen?: string;
  codforOrigen?: string;
  nroforOrigen?: number;
}

export interface GestionPendientesRequest {
  nrocta?: string;
  cartId?: number;
  items: GestionPendienteItem[];
}

export interface GestionPendientesResponse {
  itemsProcesados: number;
  filasInsertadas: number;
  cartId?: number;
  mensaje?: string;
}

export async function eliminarPendientes(
  token: string,
  body: GestionPendientesRequest,
): Promise<GestionPendientesResponse> {
  const res = await fetch(`${API_BASE}/pendientes/eliminar`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'No se pudieron eliminar los no entregados'));
  }
  return res.json();
}

export async function enviarPendientes(
  token: string,
  body: GestionPendientesRequest,
): Promise<GestionPendientesResponse> {
  const res = await fetch(`${API_BASE}/pendientes/enviar`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, 'No se pudieron enviar los no entregados'));
  }
  return res.json();
}

export function formatPedidoFecha(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (d.getHours() === 0 && d.getMinutes() === 0) return date;
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())} hs`;
}

export function formatPedidoArs(n: number | string | null | undefined): string {
  const v = typeof n === 'number' ? n : Number(n);
  const safe = Number.isFinite(v) ? v : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(safe);
}

export function formatPedidoFechaCorta(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

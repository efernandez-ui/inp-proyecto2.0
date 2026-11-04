import { getHeaders } from './products';
import { adminCacheGet, adminCacheInvalidate, ADMIN_CACHE_KEYS } from '@/lib/adminApiCache';

const base = () => `${process.env.NEXT_PUBLIC_API_BACKEND}/api/admin`;

const TTL = {
  parametros: 45_000,
  ventasList: 45_000,
  ventaDetail: 30_000,
  correos: 25_000,
};

export interface VentaEspecial {
  nroPool: number;
  descripcion?: string | null;
  estado?: string | null;
  cantidadTotal?: number | null;
  cantidadDisponible?: number | null;
  disponibleHasta?: string | null;
  observaciones?: string | null;
  fecalt?: string | null;
  fecmod?: string | null;
  userId?: string | null;
  debaja?: string | null;
}

/** Estadísticas de campaña (ESTADISTICAS_OFERTAS.sql). */
export interface OfertaEstadisticasMixSucursal {
  codigo?: string | null;
  nombre?: string | null;
  cantidadVendida?: number | null;
  porcentaje?: number | null;
  clientes?: number | null;
}

export interface OfertaEstadisticasVentaSucursalProducto {
  idOferta?: number | null;
  descripcion?: string | null;
  codigo?: string | null;
  producto?: string | null;
  cantidadPublicada?: number | null;
  cantidadConsumida?: number | null;
  totalVendido?: number | null;
  cantidadVendida?: number | null;
  sucursal?: string | null;
  porcentajeVentas?: number | null;
}

export interface OfertaEstadisticasProducto {
  tippro?: string | null;
  codigo?: string | null;
  descripcion?: string | null;
  cantidadPublicada?: number | null;
  cantidadReservada?: number | null;
  cantidadConsumida?: number | null;
  cantidadDisponible?: number | null;
  porcentajeParticipacion?: number | null;
}

export interface OfertaEstadisticasPivotSucursal {
  codigo?: string | null;
  producto?: string | null;
  noa?: number | null;
  nea?: number | null;
  bue?: number | null;
  cuy?: number | null;
  total?: number | null;
  porcentajeVentas?: number | null;
}

export interface OfertaEstadisticasVentaVendedorCliente {
  sucursal?: string | null;
  vendedor?: string | null;
  clienteCodigo?: string | null;
  cliente?: string | null;
  cantidad?: number | null;
  importe?: number | null;
}

export interface OfertaEstadisticasPenetracion {
  clientesUnicos?: number | null;
  sucursalesConVenta?: number | null;
  sucursales?: string[];
}

export interface OfertaEstadisticasTopComercial {
  vendedor?: string | null;
  unidades?: number | null;
  ingresos?: number | null;
}

export interface OfertaEstadisticas {
  idOferta: number;
  descripcion?: string | null;
  estado?: string | null;
  cantidadPublicada?: number | null;
  cantidadConsumida?: number | null;
  cantidadVendida?: number | null;
  coberturaPct?: number | null;
  diasCierre?: number | null;
  mixSucursales?: OfertaEstadisticasMixSucursal[];
  ventasSobrePublicado?: OfertaEstadisticasVentaSucursalProducto[];
  ventasSobreReservado?: OfertaEstadisticasVentaSucursalProducto[];
  sucursalesAfectadas?: string[];
  productos?: OfertaEstadisticasProducto[];
  ventasPivotSucursal?: OfertaEstadisticasPivotSucursal[];
  ventasPorVendedorCliente?: OfertaEstadisticasVentaVendedorCliente[];
  ingresos?: number | null;
  gmPct?: number | null;
  penetracion?: OfertaEstadisticasPenetracion | null;
  topComerciales?: OfertaEstadisticasTopComercial[];
}

export interface VentaEspecialEdicionItem {
  orden: number;
  tippro: string;
  artcod: string;
  descripcion?: string | null;
  cantidadTotal: number;
  cantidadDisponible: number;
  cantidadReservada: number;
  cantidadConsumida: number;
  porcentajeDescuento: number;
  precioLista?: number | null;
  precioOferta?: number | null;
}

export interface VentaEspecialEdicionDetalle {
  nroPool: number;
  descripcion?: string | null;
  observaciones?: string | null;
  estado?: string | null;
  poolthCodigo?: string | null;
  tipfin?: string | null;
  disponibleDesde?: string | null;
  disponibleHasta?: string | null;
  pathBanner?: string | null;
  bannerImageUrl?: string | null;
  cantidadTotal?: number | null;
  cantidadDisponible?: number | null;
  condicionesPago: string[];
  productos: VentaEspecialEdicionItem[];
  segmentacion: NuevaEstrategiaPayload['segmentacion'];
}

export interface ActualizarVentaEspecialEdicionPayload {
  descripcion?: string | null;
  observaciones?: string | null;
  estado?: string | null;
  disdes?: string | null;
  dishas?: string | null;
  pathBanner?: string | null;
  productos?: Array<{
    orden: number;
    cantidadTotal?: number;
    cantidadConsumida?: number;
    porcentajeDescuento?: number;
    eliminar?: boolean;
  }>;
  productosNuevos?: NuevaEstrategiaPayload['productos'];
}

/** Maestro USR_POOLTH (tipos de oferta / estrategia). */
export interface TipoOfertaPool {
  codigo: string;
  descripcion?: string | null;
  descripcionDetalle?: string | null;
}

export interface SegmentacionProvinciaOption {
  codpai: string;
  codpro: string;
  descripcion: string;
  value: string;
  label: string;
}

export interface SegmentacionClienteOption {
  value: string;
  label: string;
  nrocta: string;
  nombre: string;
}

export interface SegmentacionClienteResolverItem {
  nrocta: string;
  razonSocial: string;
}

export interface SegmentacionClienteResolverEncontrado {
  nrocta: string;
  nombre: string;
  razonSocialExcel: string;
  coincideRazonSocial: boolean;
}

export interface SegmentacionClienteResolverNoEncontrado {
  nrocta: string;
  razonSocial: string;
  motivo: string;
}

export interface SegmentacionClienteResolverResponse {
  encontrados: SegmentacionClienteResolverEncontrado[];
  noEncontrados: SegmentacionClienteResolverNoEncontrado[];
  duplicadosOmitidos: number;
}

export interface OfertaProductoResolverItem {
  sku: string;
  descripcion: string;
  cantidad: number;
  dtoPct: number;
}

export interface OfertaProductoResolverEncontrado {
  sku: string;
  tippro: string;
  artcod: string;
  descripcion: string;
  cantidad: number;
  dtoPct: number;
  stockNoa: number;
  stockNea: number;
  stockBue: number;
  stockCuy: number;
  precioLista: number;
  precioCosto: number | null;
  tipo: string | null;
  subtipo: string | null;
  marca: string | null;
}

export interface OfertaProductoResolverNoEncontrado {
  sku: string;
  descripcion: string;
  motivo: string;
}

export interface OfertaProductoResolverResponse {
  encontrados: OfertaProductoResolverEncontrado[];
  noEncontrados: OfertaProductoResolverNoEncontrado[];
  duplicadosOmitidos: number;
}

export interface SegmentacionImpactoEstimadoResponse {
  total: number;
  universoCompleto: boolean;
}

export interface SegmentacionImpactoEstimadoPayload {
  clientes: Array<{ nrocta: string }>;
  sucursales: Array<{ sitios: string }>;
  localidades: Array<{ codpai: string; codpos: string; jurisd: string | null }>;
}

export interface SegmentacionSucursalOption {
  value: string;
  label: string;
  codigo: string;
  descripcion: string;
}

export interface SegmentacionLocalidadOption {
  value: string;
  label: string;
  codpai: string;
  codpos: string;
  jurisd?: string | null;
  descripcion?: string | null;
}

export interface CondicionPagoOption {
  cndpag: string;
  descripcion: string;
}

export interface NuevaEstrategiaPayload {
  poolth: string | null;
  /** Tipo de finalizaci?n en cabecera USR_POOL (B/C/S). */
  tipfin: string | null;
  /** Códigos VTTCPH_CNDPAG (obligatorio, al menos uno). */
  condicionesPago: string[];
  vigencia: {
    disdes: string | null;
    dishas: string | null;
    descrp: string | null;
    textos: string | null;
    pathia: string | null;
    pathib: string | null;
    pathic: string | null;
    pathfc: string | null;
  };
  productos: Array<{
    tippro: string;
    artcod: string;
    stockOferta: number;
    dtoPct: number;
    precioOferta: number;
    precioLista: number;
    precioCosto: number | null;
  }>;
  segmentacion: {
    clientes: Array<{ nrocta: string }>;
    sucursales: Array<{ sitios: string }>;
    localidades: Array<{ codpai: string; codpos: string; jurisd: string | null }>;
  };
}

export interface ParametroTv {
  id?: number;
  emailRecepcionConsulta?: string | null;
  smtpHost?: string | null;
  smtpStarttls?: string | null;
  smtpPuerto?: string | null;
  smtpNombreCuenta?: string | null;
  smtpUsuario?: string | null;
  smtpPassword?: string | null;
  smtpAuth?: string | null;
  smtpTipo?: string | null;
  smtpDireccionEnvio?: string | null;
  smtpNombreEnvio?: string | null;
  enviaNotificaciones?: string | null;
  plantillaNotificaciones?: string | null;
  pathUpload?: string | null;
  sistemaEnMantenimiento?: string | null;
  mensajeMantenimiento?: string | null;
  pathImagenesHome?: string | null;
  pathImagenesPrincipal?: string | null;
  pathImagenesProductos?: string | null;
  pathImagenesDefault?: string | null;
  imagenUnicaHome?: string | null;
  linkRevistaEM?: string | null;
  correoElectronicoPool?: string | null;
  correoElectronicoPromocion?: string | null;
  pathImagenPromocionInicio?: string | null;
  pathImagenPromocionFin?: string | null;
  pathImagenBannerCatalogo?: string | null;
  modoPrueba?: string | null;
  recepcionNotificacionModoPrueba?: string | null;
  disponibilidadChat?: string | null;
  tipoHome?: string | null;
  cantidadMaximaItem?: number | null;
  tragamonedaActivo?: string | null;
  descuentoJuegoGanador?: string | number | null;
  version?: string | null;
  plantillaSolicitudCliente?: string | null;
  muestraNovedades?: string | null;
  muestraMasComprados?: string | null;
  muestraUltimosIngresos?: string | null;
  urlWhatsapp?: string | null;
  linkAccesoQr?: string | null;
}

export interface ParametroGeneralPayload {
  linkAccesoQr?: string | null;
  modoPrueba?: string | null;
  version?: string | null;
  disponibilidadChat?: string | null;
  muestraNovedades?: string | null;
  muestraMasComprados?: string | null;
  muestraUltimosIngresos?: string | null;
  tipoHome?: string | null;
  imagenUnicaHome?: string | null;
  pathImagenesDefault?: string | null;
  pathImagenesHome?: string | null;
  pathImagenesPrincipal?: string | null;
  linkRevistaEM?: string | null;
  pathUpload?: string | null;
  sistemaEnMantenimiento?: string | null;
  mensajeMantenimiento?: string | null;
}

export interface ParametroNotificacionesPayload {
  urlWhatsapp?: string | null;
  smtpNombreCuenta?: string | null;
  smtpUsuario?: string | null;
  smtpPassword?: string | null;
  smtpPuerto?: string | null;
  smtpStarttls?: string | null;
  smtpAuth?: string | null;
  smtpHost?: string | null;
  smtpTipo?: string | null;
  smtpDireccionEnvio?: string | null;
  smtpNombreEnvio?: string | null;
  emailRecepcionConsulta?: string | null;
  correoElectronicoPool?: string | null;
  recepcionNotificacionModoPrueba?: string | null;
  plantillaNotificaciones?: string | null;
}

export interface ParametroSolicitudClientePayload {
  plantillaSolicitudCliente?: string | null;
}

export interface ParametroCarritosPayload {
  cantidadMaximaItem?: number | null;
  enviaNotificaciones?: string | null;
  tragamonedaActivo?: string | null;
  descuentoJuegoGanador?: string | number | null;
}

export interface ParametroCatalogoPayload {
  pathImagenesProductos?: string | null;
}

export interface ParametroPopupRow {
  orden: number;
  descripcion?: string | null;
  pathImagen?: string | null;
  link?: string | null;
  tipoBanner?: string | null;
  activo?: string | null;
  fechaHasta?: string | null;
  debaja?: string | null;
}

export interface ParametroBannerRow {
  orden: number;
  descripcion?: string | null;
  pathImagen?: string | null;
  link?: string | null;
  tipoBanner?: string | null;
  activo?: string | null;
  debaja?: string | null;
}

export interface ParametroBannersPayload {
  popups?: ParametroPopupRow[];
  homeBanners?: ParametroBannerRow[];
}

export interface S3UploadResponse {
  key: string;
  url: string;
  /** Nombre de archivo puro, para guardar en pathImagen (banners/popups). */
  fileName?: string;
}

export interface SyncRunResponse {
  target:
    | 'productos'
    | 'atributos'
    | 'aplicaciones'
    | 'presentaciones'
    | 'imagenes'
    | 'excepciones'
    | 'videos'
    | 'ofertas'
    | 'vinculados'
    | 'coeficientes-tarjetas'
    | 'cotizacion-dolar'
    | 'home-curated-lists';
  processed: number;
  saved: number;
  elapsedMs: number;
  message?: string;
}

export interface CorreoElectronicoTv {
  nroEnvio: number;
  fechaEnvio?: string | null;
  nrocta?: string | null;
  destinatarios?: string | null;
  asunto?: string | null;
  contenido?: string | null;
  enviado?: string | null;
  error?: string | null;
}

/** Respuesta paginada Spring Data (page plano o anidado en `page`). */
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export type PageCorreosNoEnviados = SpringPage<CorreoElectronicoTv>;
export type PageVentasEspeciales = SpringPage<VentaEspecial>;

/** Spring Boot 3.5+ puede serializar Page como `{ content, page: { totalElements, ... } }`. */
function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function normalizeSpringPage<T>(raw: unknown): SpringPage<T> {
  if (!raw || typeof raw !== 'object') {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 0,
      first: true,
      last: true,
    };
  }
  const o = raw as Record<string, unknown>;
  const content = Array.isArray(o.content) ? (o.content as T[]) : [];
  const nested = o.page && typeof o.page === 'object' ? (o.page as Record<string, unknown>) : null;

  const totalElements = nested ? num(nested.totalElements, 0) : num(o.totalElements, 0);
  const totalPages = nested ? num(nested.totalPages, 0) : num(o.totalPages, 0);
  const number = nested ? num(nested.number, 0) : num(o.number, 0);
  const size = nested ? num(nested.size, content.length || 10) : num(o.size, content.length || 10);

  let first: boolean;
  let last: boolean;
  if (nested) {
    first = typeof nested.first === 'boolean' ? nested.first : number === 0;
    last =
      typeof nested.last === 'boolean'
        ? nested.last
        : totalPages <= 0 || number >= totalPages - 1;
  } else {
    first = typeof o.first === 'boolean' ? o.first : number === 0;
    last = typeof o.last === 'boolean' ? o.last : totalPages <= 0 || number >= totalPages - 1;
  }

  return { content, totalElements, totalPages, number, size, first, last };
}

function buildVentasEspecialesQuery(page: number, size: number, fechaDesde?: string, fechaHasta?: string, estado?: string): string {
  const q = new URLSearchParams();
  q.set('page', String(page));
  q.set('size', String(size));
  if (fechaDesde) q.set('fechaDesde', fechaDesde);
  if (fechaHasta) q.set('fechaHasta', fechaHasta);
  if (estado) q.set('estado', estado);
  return q.toString();
}

async function fetchVentasEspecialesUncached(
  page: number,
  size: number,
  fechaDesde?: string,
  fechaHasta?: string,
  estado?: string
): Promise<PageVentasEspeciales> {
  const res = await fetch(`${base()}/ventas-especiales?${buildVentasEspecialesQuery(page, size, fechaDesde, fechaHasta, estado)}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudieron cargar las ventas especiales');
  const raw = await res.json();
  return normalizeSpringPage<VentaEspecial>(raw);
}

export async function getVentasEspeciales(opts?: {
  force?: boolean;
  page?: number;
  size?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
}): Promise<PageVentasEspeciales> {
  const page = Math.max(0, opts?.page ?? 0);
  const size = Math.min(100, Math.max(1, opts?.size ?? 10));
  const fd = opts?.fechaDesde?.trim() || '';
  const fh = opts?.fechaHasta?.trim() || '';
  const estado = opts?.estado?.trim() || '';
  const cacheKey = `${ADMIN_CACHE_KEYS.ventasEspeciales}:${page}:${size}:${fd}:${fh}:${estado}`;
  if (opts?.force) adminCacheInvalidate(ADMIN_CACHE_KEYS.ventasEspeciales);
  return adminCacheGet(cacheKey, TTL.ventasList, () =>
    fetchVentasEspecialesUncached(page, size, fd || undefined, fh || undefined, estado || undefined)
  );
}

async function fetchVentaEspecialUncached(nrpool: number): Promise<VentaEspecial> {
  const res = await fetch(`${base()}/ventas-especiales/${encodeURIComponent(String(nrpool))}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar la venta especial');
  return res.json();
}

export async function getVentaEspecial(nrpool: number, opts?: { force?: boolean }): Promise<VentaEspecial> {
  const key = ADMIN_CACHE_KEYS.ventaEspecial(nrpool);
  if (opts?.force) adminCacheInvalidate(key);
  return adminCacheGet(key, TTL.ventaDetail, () => fetchVentaEspecialUncached(nrpool));
}

export async function getVentaEspecialEdicion(nrpool: number): Promise<VentaEspecialEdicionDetalle> {
  const res = await fetch(`${base()}/ventas-especiales/${encodeURIComponent(String(nrpool))}/edicion`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar la venta especial para edición');
  return res.json();
}

export async function getOfertaEstadisticas(nrpool: number): Promise<OfertaEstadisticas> {
  const res = await fetch(
    `${base()}/ventas-especiales/${encodeURIComponent(String(nrpool))}/estadisticas`,
    {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error('No se pudieron cargar las estadísticas de la oferta');
  return res.json();
}

export async function updateVentaEspecialEdicion(
  nrpool: number,
  body: ActualizarVentaEspecialEdicionPayload
): Promise<VentaEspecialEdicionDetalle> {
  const res = await fetch(`${base()}/ventas-especiales/${encodeURIComponent(String(nrpool))}/edicion`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'No se pudo guardar la edición');
  }
  invalidateVentasCaches();
  return res.json();
}

function invalidateVentasCaches() {
  adminCacheInvalidate(ADMIN_CACHE_KEYS.ventasEspeciales);
  adminCacheInvalidate('admin:venta-especial:');
}

export async function createVentaEspecial(body: Partial<VentaEspecial>): Promise<VentaEspecial> {
  const res = await fetch(`${base()}/ventas-especiales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudo crear la venta especial');
  const data = (await res.json()) as VentaEspecial;
  invalidateVentasCaches();
  return data;
}

export async function createVentaEspecialWizard(payload: NuevaEstrategiaPayload): Promise<VentaEspecial> {
  const res = await fetch(`${base()}/ventas-especiales/wizard`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'No se pudo guardar la oferta completa');
  }
  const data = (await res.json()) as VentaEspecial;
  invalidateVentasCaches();
  return data;
}

export async function updateVentaEspecial(nrpool: number, body: Partial<VentaEspecial>): Promise<VentaEspecial> {
  const res = await fetch(`${base()}/ventas-especiales/${encodeURIComponent(String(nrpool))}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudo actualizar la venta especial');
  const data = (await res.json()) as VentaEspecial;
  invalidateVentasCaches();
  return data;
}

export async function deleteVentaEspecial(nrpool: number): Promise<void> {
  const res = await fetch(`${base()}/ventas-especiales/${encodeURIComponent(String(nrpool))}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('No se pudo eliminar la venta especial');
  invalidateVentasCaches();
}

export async function confirmarVentaEspecial(nrpool: number): Promise<VentaEspecial> {
  const res = await fetch(`${base()}/ventas-especiales/${encodeURIComponent(String(nrpool))}/confirmar`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('No se pudo confirmar la venta especial');
  const data = (await res.json()) as VentaEspecial;
  invalidateVentasCaches();
  return data;
}

export async function getPoolTiposOferta(): Promise<TipoOfertaPool[]> {
  const res = await fetch(`${base()}/pool-tipos-oferta`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudieron cargar los tipos de oferta');
  return res.json();
}

export async function getCondicionesPago(): Promise<CondicionPagoOption[]> {
  const res = await fetch(`${base()}/condiciones-pago`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudieron cargar las condiciones de pago');
  return res.json();
}

export async function createPoolTipoOferta(body: {
  codigo: string;
  descripcion?: string | null;
  descripcionDetalle?: string | null;
}): Promise<TipoOfertaPool> {
  const res = await fetch(`${base()}/pool-tipos-oferta`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 409) throw new Error('Ya existe un tipo de oferta con ese c?digo');
  if (!res.ok) throw new Error('No se pudo crear el tipo de oferta');
  return res.json();
}

export async function getSegmentacionProvincias(codpai = '054'): Promise<SegmentacionProvinciaOption[]> {
  const params = new URLSearchParams({ codpai });
  const res = await fetch(`${base()}/segmentacion/provincias?${params}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar la lista de provincias');
  return res.json();
}

export async function getSegmentacionClientes(params: {
  q: string;
  limit?: number;
}): Promise<SegmentacionClienteOption[]> {
  const search = new URLSearchParams({ q: params.q });
  if (params.limit != null) search.set('limit', String(params.limit));
  const res = await fetch(`${base()}/segmentacion/clientes?${search}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar la lista de clientes');
  return res.json();
}

export async function postSegmentacionClientesResolver(
  items: SegmentacionClienteResolverItem[]
): Promise<SegmentacionClienteResolverResponse> {
  const res = await fetch(`${base()}/segmentacion/clientes/resolver`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'No se pudieron validar los clientes importados');
  }
  return res.json();
}

export async function postOfertaProductosResolver(
  items: OfertaProductoResolverItem[]
): Promise<OfertaProductoResolverResponse> {
  const res = await fetch(`${base()}/ventas-especiales/productos/resolver`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'No se pudieron validar los productos importados');
  }
  return res.json();
}

export async function getSegmentacionSucursales(): Promise<SegmentacionSucursalOption[]> {
  const res = await fetch(`${base()}/segmentacion/sucursales`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar la lista de sucursales');
  return res.json();
}

export async function postSegmentacionImpactoEstimado(
  payload: SegmentacionImpactoEstimadoPayload
): Promise<SegmentacionImpactoEstimadoResponse> {
  const res = await fetch(`${base()}/segmentacion/impacto-estimado`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'No se pudo estimar el impacto de clientes');
  }
  return res.json();
}

export async function getSegmentacionLocalidades(params: {
  codpai?: string;
  codpro: string;
  q?: string;
  limit?: number;
}): Promise<SegmentacionLocalidadOption[]> {
  const search = new URLSearchParams({
    codpro: params.codpro,
    codpai: params.codpai ?? '054',
  });
  if (params.q) search.set('q', params.q);
  if (params.limit != null) search.set('limit', String(params.limit));
  const res = await fetch(`${base()}/segmentacion/localidades?${search}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar la lista de localidades');
  return res.json();
}

const parametrosRoot = () => `${base()}/parametros`;

function invalidateParametrosCaches() {
  adminCacheInvalidate(ADMIN_CACHE_KEYS.parametros);
  adminCacheInvalidate('admin:parametros:');
}

async function fetchParametrosUncached(): Promise<ParametroTv> {
  const res = await fetch(parametrosRoot(), {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudieron cargar los par?metros');
  return res.json();
}

export async function getParametros(opts?: { force?: boolean }): Promise<ParametroTv> {
  if (opts?.force) adminCacheInvalidate(ADMIN_CACHE_KEYS.parametros);
  return adminCacheGet(ADMIN_CACHE_KEYS.parametros, TTL.parametros, fetchParametrosUncached);
}

export async function updateParametros(body: ParametroTv): Promise<ParametroTv> {
  const res = await fetch(parametrosRoot(), {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ ...body, id: 1 }),
  });
  if (!res.ok) throw new Error('No se pudieron guardar los par?metros');
  const data = (await res.json()) as ParametroTv;
  invalidateParametrosCaches();
  return data;
}

export async function getParametrosGeneral(): Promise<ParametroGeneralPayload> {
  const res = await fetch(`${parametrosRoot()}/general`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar la configuraci?n general');
  return res.json();
}

export async function putParametrosGeneral(body: ParametroGeneralPayload): Promise<ParametroGeneralPayload> {
  const res = await fetch(`${parametrosRoot()}/general`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudo guardar la configuraci?n general');
  const data = (await res.json()) as ParametroGeneralPayload;
  invalidateParametrosCaches();
  return data;
}

export async function getParametrosNotificaciones(): Promise<ParametroNotificacionesPayload> {
  const res = await fetch(`${parametrosRoot()}/notificaciones`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar notificaciones');
  return res.json();
}

export async function putParametrosNotificaciones(
  body: ParametroNotificacionesPayload
): Promise<ParametroNotificacionesPayload> {
  const res = await fetch(`${parametrosRoot()}/notificaciones`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudo guardar notificaciones');
  const data = (await res.json()) as ParametroNotificacionesPayload;
  invalidateParametrosCaches();
  return data;
}

export async function postParametrosNotificacionesPruebaHtml(): Promise<void> {
  const res = await fetch(`${parametrosRoot()}/notificaciones/envio-prueba-html`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    let msg = '';
    try {
      const j = (await res.json()) as { error?: string };
      msg = j.error || '';
    } catch {
      /* ignore */
    }
    throw new Error(msg || 'No se pudo enviar la prueba');
  }
}

export async function getParametrosSolicitudCliente(): Promise<ParametroSolicitudClientePayload> {
  const res = await fetch(`${parametrosRoot()}/solicitud-cliente`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar solicitud de cliente');
  return res.json();
}

export async function putParametrosSolicitudCliente(
  body: ParametroSolicitudClientePayload
): Promise<ParametroSolicitudClientePayload> {
  const res = await fetch(`${parametrosRoot()}/solicitud-cliente`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudo guardar solicitud de cliente');
  const data = (await res.json()) as ParametroSolicitudClientePayload;
  invalidateParametrosCaches();
  return data;
}

export async function getParametrosCarritos(): Promise<ParametroCarritosPayload> {
  const res = await fetch(`${parametrosRoot()}/carritos`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar carritos');
  return res.json();
}

export async function putParametrosCarritos(body: ParametroCarritosPayload): Promise<ParametroCarritosPayload> {
  const res = await fetch(`${parametrosRoot()}/carritos`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudo guardar carritos');
  const data = (await res.json()) as ParametroCarritosPayload;
  invalidateParametrosCaches();
  return data;
}

export async function getParametrosCatalogo(): Promise<ParametroCatalogoPayload> {
  const res = await fetch(`${parametrosRoot()}/catalogo`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo cargar cat?logo');
  return res.json();
}

export async function putParametrosCatalogo(body: ParametroCatalogoPayload): Promise<ParametroCatalogoPayload> {
  const res = await fetch(`${parametrosRoot()}/catalogo`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudo guardar cat?logo');
  const data = (await res.json()) as ParametroCatalogoPayload;
  invalidateParametrosCaches();
  return data;
}

export async function getParametrosBanners(): Promise<ParametroBannersPayload> {
  const res = await fetch(`${parametrosRoot()}/banners`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudieron cargar banners');
  return res.json();
}

export async function putParametrosBanners(body: ParametroBannersPayload): Promise<ParametroBannersPayload> {
  const res = await fetch(`${parametrosRoot()}/banners`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudieron guardar banners');
  const data = (await res.json()) as ParametroBannersPayload;
  invalidateParametrosCaches();
  return data;
}

/** Sube una imagen al bucket S3 (admin). No uses getHeaders(): el boundary de multipart lo fija el navegador. */
export async function postAdminImageUpload(
  file: File,
  folder: 'banners' | 'popups' | 'parametros' | 'pools'
): Promise<S3UploadResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (!token) throw new Error('No autenticado');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch(`${base()}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Error al subir (${res.status})`);
  }
  return res.json() as Promise<S3UploadResponse>;
}

export async function postCatalogoAccion(
  accion:
    | 'actualizar-precios'
    | 'actualizar-productos-oferta'
    | 'actualizar-visibilidad-productos'
    | 'actualizar-aplicaciones-productos'
): Promise<string | undefined> {
  const res = await fetch(`${parametrosRoot()}/catalogo/acciones/${accion}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (res.status === 501) {
    const j = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(j.message || 'Acci?n a?n no implementada en el backend nuevo');
  }
  const j = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(j.message || 'La acción falló');
  return j.message;
}

export async function postAdminSync(
  target: SyncRunResponse['target']
): Promise<SyncRunResponse> {
  const res = await fetch(`${base()}/sync/${target}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let fromJson = '';
    try {
      const j = JSON.parse(text) as { message?: string };
      if (typeof j?.message === 'string' && j.message.trim()) fromJson = j.message.trim();
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(fromJson || text.trim() || `Sync fall? (${res.status})`);
  }
  return res.json() as Promise<SyncRunResponse>;
}

function buildCorreosNoEnviadosQuery(
  page: number,
  size: number,
  fechaDesde?: string,
  fechaHasta?: string,
  asunto?: string,
  email?: string
): string {
  const q = new URLSearchParams();
  q.set('page', String(page));
  q.set('size', String(size));
  if (fechaDesde) q.set('fechaDesde', fechaDesde);
  if (fechaHasta) q.set('fechaHasta', fechaHasta);
  if (asunto) q.set('asunto', asunto);
  if (email) q.set('email', email);
  return q.toString();
}

async function fetchCorreosNoEnviadosUncached(
  page: number,
  size: number,
  fechaDesde?: string,
  fechaHasta?: string,
  asunto?: string,
  email?: string
): Promise<PageCorreosNoEnviados> {
  const res = await fetch(`${base()}/correo-no-enviados?${buildCorreosNoEnviadosQuery(page, size, fechaDesde, fechaHasta, asunto, email)}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudieron cargar los correos');
  const raw = await res.json();
  return normalizeSpringPage<CorreoElectronicoTv>(raw);
}

export async function getCorreosNoEnviados(opts?: {
  force?: boolean;
  page?: number;
  size?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  asunto?: string;
  email?: string;
}): Promise<PageCorreosNoEnviados> {
  const page = Math.max(0, opts?.page ?? 0);
  const size = Math.min(100, Math.max(1, opts?.size ?? 10));
  const fd = opts?.fechaDesde?.trim() || '';
  const fh = opts?.fechaHasta?.trim() || '';
  const asunto = opts?.asunto?.trim() || '';
  const email = opts?.email?.trim() || '';
  const cacheKey = `${ADMIN_CACHE_KEYS.correosNoEnviados}:${page}:${size}:${fd}:${fh}:${asunto}:${email}`;
  if (opts?.force) adminCacheInvalidate(ADMIN_CACHE_KEYS.correosNoEnviados);
  return adminCacheGet(cacheKey, TTL.correos, () =>
    fetchCorreosNoEnviadosUncached(page, size, fd || undefined, fh || undefined, asunto || undefined, email || undefined)
  );
}

export async function reenviarCorreo(nroEnvio: number): Promise<void> {
  const res = await fetch(
    `${base()}/correo-no-enviados/${encodeURIComponent(String(nroEnvio))}/reenviar`,
    { method: 'POST', headers: getHeaders() }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'No se pudo enviar el correo');
  }
  adminCacheInvalidate(ADMIN_CACHE_KEYS.correosNoEnviados);
}

export async function reenviarTodoCorreos(): Promise<{ enviados: number; fallidos: number; total: number }> {
  const res = await fetch(`${base()}/correo-no-enviados/enviar-todo`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('No se pudo enviar todo');
  adminCacheInvalidate(ADMIN_CACHE_KEYS.correosNoEnviados);
  return res.json();
}

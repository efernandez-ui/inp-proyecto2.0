import type { ProductoDTO } from '@/interfaces/producto';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BACKEND}/api`;

export interface HomeBanner {
  orden: number;
  descripcion: string;
  tipoBanner?: string | null;
  link?: string | null;
  pathImagen?: string | null;
  imageUrl?: string | null;
}

export interface HomeBannersResponse {
  tipoHome?: string | null;
  imagenUnicaHome?: string | null;
  pathImagenesHome?: string | null;
  banners: HomeBanner[];
}

export interface HomePopup {
  orden: number;
  descripcion?: string | null;
  tipoBanner?: string | null;
  link?: string | null;
  pathImagen?: string | null;
  imageUrl?: string | null;
  fechaHasta?: string | null;
}

export interface HomePopupsResponse {
  popups: HomePopup[];
}

export interface HomeResumen {
  needsClientSelection: boolean;
  saldoDisponible?: number | null;
  saldoVencido?: number | null;
  carritosActivos: number;
  pedidosPendientes: number;
  pendientesConStock?: number;
  promedioDiasVencido?: number | null;
  ultimaCompraFecha?: string | null;
  ultimaCompraModfor?: string | null;
  ultimaCompraCodfor?: string | null;
  ultimaCompraNrofor?: number | null;
}

export interface OfertaBanner {
  nroPool: number;
  descripcion?: string | null;
  poolth?: string | null;
  tipfin?: string | null;
  disdes?: number | null;
  dishas?: number | null;
  pathBanner?: string | null;
  bannerImageUrl?: string | null;
  link?: string | null;
  cantidadTotal?: number | null;
  cantidadDisponible?: number | null;
  cuentaRegresiva?: boolean | null;
  cierrePorStock?: boolean | null;
}

export interface OfertaBannersResponse {
  needsClientSelection?: boolean;
  banners: OfertaBanner[];
}

export interface HomeCuratedListsResponse {
  muestraDestacados: boolean;
  muestraMasVendidos: boolean;
  muestraUltimosIngresos: boolean;
  destacados: ProductoDTO[];
  masVendidos: ProductoDTO[];
  ultimosIngresos: ProductoDTO[];
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function getHomeBanners(): Promise<HomeBannersResponse> {
  const response = await fetch(`${API_BASE_URL}/public/home/banners`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch home banners (${response.status})`);
  }
  return response.json();
}

export async function getHomePopups(): Promise<HomePopupsResponse> {
  if (process.env.NEXT_PUBLIC_STATIC_SITE === 'true') {
    return { popups: [] };
  }

  const response = await fetch(`${API_BASE_URL}/public/home/popups`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch home popups (${response.status})`);
  }
  return response.json();
}

export async function getHomeResumen(nrocta?: string): Promise<HomeResumen> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No token');
  }
  const qs = nrocta ? `?nrocta=${encodeURIComponent(nrocta)}` : '';
  const response = await fetch(`${API_BASE_URL}/home/resumen${qs}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch home resumen (${response.status})`);
  }
  return response.json();
}

export async function getHomeOfertaBanners(nrocta?: string): Promise<OfertaBannersResponse> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No token');
  }
  const qs = nrocta ? `?nrocta=${encodeURIComponent(nrocta)}` : '';
  const response = await fetch(`${API_BASE_URL}/home/ofertas/banners${qs}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch oferta banners (${response.status})`);
  }
  return response.json();
}

export async function getHomeCuratedLists(nrocta?: string): Promise<HomeCuratedListsResponse> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No token');
  }
  const qs = nrocta ? `?nrocta=${encodeURIComponent(nrocta)}` : '';
  const response = await fetch(`${API_BASE_URL}/home/curated-lists${qs}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch curated lists (${response.status})`);
  }
  return response.json();
}

export function formatSaldoArs(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatHomeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function isVideoPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return /\.mp4(\?|$)/i.test(path.trim());
}

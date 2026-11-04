import type { ProductoDTO } from '@/interfaces/producto';
import type { OfertaProductoResolverEncontrado } from '@/services/admin';

export type OfertaProductoSeleccionado = {
  key: string;
  tippro: string;
  artcod: string;
  descripcion: string;
  tipo: string | null;
  subtipo: string | null;
  marca: string | null;
  stockNoa: number;
  stockNea: number;
  stockBue: number;
  stockCuy: number;
  stockOferta: number;
  precioLista: number;
  costo: number | null;
  dtoPct: number;
  precioOferta: number;
  cms: number | null;
  cmPct: number | null;
};

export function asNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return 0;
    const compact = raw.replace(/\s+/g, '');
    const normalized =
      compact.includes(',') && compact.includes('.')
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function asNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    const compact = raw.replace(/\s+/g, '');
    const normalized =
      compact.includes(',') && compact.includes('.')
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const DEFAULT_IVA_PCT = 21;

export function resolveIvaPct(iva?: number | null): number {
  if (iva == null || !Number.isFinite(iva) || iva <= 0) return DEFAULT_IVA_PCT;
  return iva;
}

export function resolveCostoConIva(precioCostoNeto: number | null, ivaPct?: number | null): number | null {
  if (precioCostoNeto == null) return null;
  const iva = resolveIvaPct(ivaPct);
  return precioCostoNeto * (1 + iva / 100);
}

export function resolvePrecioLista(product: ProductoDTO): number {
  const precioMarcado = asNumber(product.precioMarcado);
  if (precioMarcado > 0) return precioMarcado;

  const precioReferencia = asNumber(product.precioReferencia);
  if (precioReferencia > 0) return precioReferencia;

  const precioFinalPeso = asNumber(product.precioFinalPeso);
  if (precioFinalPeso > 0) return precioFinalPeso;

  const precioReposicion = asNumber(product.precioReposicion);
  if (precioReposicion > 0) return precioReposicion;

  const preven = asNumber(product.preven);
  const cotizacionUSD = asNumber(product.cotizacionUSD);
  if (preven > 0 && cotizacionUSD > 0) return preven * cotizacionUSD;

  if (preven > 0) return preven;
  return 0;
}

export function computeMetrics(base: {
  precioLista: number;
  costo: number | null;
  dtoPct: number;
}): Pick<OfertaProductoSeleccionado, 'precioOferta' | 'cms' | 'cmPct'> {
  const precioOferta = Math.max(0, base.precioLista * (1 - base.dtoPct / 100));
  if (base.costo == null) return { precioOferta, cms: null, cmPct: null };
  const cms = precioOferta - base.costo;
  const cmPct = precioOferta > 0 ? (cms / precioOferta) * 100 : null;
  return { precioOferta, cms, cmPct };
}

export function mapProductoToItem(product: ProductoDTO, dtoPct: number): OfertaProductoSeleccionado {
  const precioLista = resolvePrecioLista(product);
  const costo = resolveCostoConIva(asNullableNumber(product.precioCosto), product.iva);
  const { precioOferta, cms, cmPct } = computeMetrics({ precioLista, costo, dtoPct });
  const stockNoa = asNumber(product.stockNoa);
  const stockNea = asNumber(product.stockNea);
  const stockBue = asNumber(product.stockBue);
  const stockCuy = asNumber(product.stockCuy);
  const stockTotal = stockNoa + stockNea + stockBue + stockCuy;
  return {
    key: `${(product.tippro || '').trim()}-${(product.artcod || '').trim()}`,
    tippro: (product.tippro || '').trim(),
    artcod: (product.artcod || '').trim(),
    descripcion: product.descripcion || '',
    tipo: product.tipo ?? null,
    subtipo: product.subtipo ?? null,
    marca: product.marca ?? null,
    stockNoa,
    stockNea,
    stockBue,
    stockCuy,
    stockOferta: stockTotal > 0 ? 1 : 0,
    precioLista,
    costo,
    dtoPct,
    precioOferta,
    cms,
    cmPct,
  };
}

export function mapResolverItemToOfertaProducto(
  item: OfertaProductoResolverEncontrado
): OfertaProductoSeleccionado {
  const precioLista = asNumber(item.precioLista);
  const costo = asNullableNumber(item.precioCosto);
  const dtoPct = asNumber(item.dtoPct);
  const { precioOferta, cms, cmPct } = computeMetrics({ precioLista, costo, dtoPct });
  return {
    key: `${item.tippro.trim()}-${item.artcod.trim()}`,
    tippro: item.tippro.trim(),
    artcod: item.artcod.trim(),
    descripcion: item.descripcion || '',
    tipo: item.tipo ?? null,
    subtipo: item.subtipo ?? null,
    marca: item.marca ?? null,
    stockNoa: asNumber(item.stockNoa),
    stockNea: asNumber(item.stockNea),
    stockBue: asNumber(item.stockBue),
    stockCuy: asNumber(item.stockCuy),
    stockOferta: Math.max(0, Math.trunc(asNumber(item.cantidad))),
    precioLista,
    costo,
    dtoPct,
    precioOferta,
    cms,
    cmPct,
  };
}

export function mergeProductos(
  existing: OfertaProductoSeleccionado[],
  incoming: OfertaProductoSeleccionado[]
): OfertaProductoSeleccionado[] {
  const map = new Map<string, OfertaProductoSeleccionado>();
  for (const item of existing) {
    map.set(item.key, item);
  }
  for (const item of incoming) {
    map.set(item.key, item);
  }
  return Array.from(map.values());
}

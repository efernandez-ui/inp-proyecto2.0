import * as XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProductoDTO } from '@/interfaces/producto';
import { calcularPrecioPublico, resolvePreciosMoneda } from '@/utils/productoPrecios';
import { resolveOfertaPrecios } from '@/utils/ofertaPrecios';

/** Columnas Excel (layout de lista de precios). */
export type PrecioExportColumn =
  | 'codigo'
  | 'cantidad'
  | 'nroParte'
  | 'descripcion'
  | 'tipo'
  | 'subtipo'
  | 'marca'
  | 'presentacion'
  | 'presentacion2'
  | 'disponible'
  | 'origen'
  | 'moneda'
  | 'variacion'
  | 'unitSinIva'
  | 'unitConIva'
  | 'refOnline'
  | 'marcado';

export const PRECIO_EXPORT_COLUMNS: { key: PrecioExportColumn; label: string }[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'nroParte', label: 'Nro Parte' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'subtipo', label: 'Subtipo' },
  { key: 'marca', label: 'Marca' },
  { key: 'presentacion', label: 'Presentación' },
  { key: 'presentacion2', label: 'Presentación 2*' },
  { key: 'disponible', label: 'Disponible' },
  { key: 'origen', label: 'Origen' },
  { key: 'moneda', label: 'Moneda' },
  { key: 'variacion', label: 'Variación de precio' },
  { key: 'unitSinIva', label: '$ Unit. s/I.V.A.' },
  { key: 'unitConIva', label: '$ Unit. c/I.V.A.' },
  { key: 'refOnline', label: '$ Ref. Online c/I.V.A.' },
  { key: 'marcado', label: '$ Marcado c/I.V.A' },
];

export type DatosExportScope = 'A' | 'C';
export type TipoArchivoExport = 'E' | 'P';

export type PreparedExportRow = {
  codigo: string;
  cantidad: string;
  nroParte: string;
  descripcion: string;
  tipo: string;
  subtipo: string;
  marca: string;
  presentacion: string;
  presentacion2: string;
  disponible: string;
  origen: string;
  moneda: string;
  variacion: string;
  unitSinIva: number;
  unitConIva: number;
  refOnline: number;
  marcado: number;
  conVariacion: boolean;
};

export type PreparePricesOpts = {
  aplicaConversion: boolean;
  moneda: 'ARS' | 'USD';
  markupPercentage: number;
  /** Cotización USD del día (fallback si el ítem no trae cotizacionUSD). */
  cotizacionUSD: number;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function codigoOf(p: ProductoDTO): string {
  return `${(p.tippro || '').trim()}${(p.artcod || '').trim()}`;
}

function stockPositive(p: ProductoDTO, branch: 'NOA' | 'NEA' | 'BUE' | 'CUY'): boolean {
  const fromList = p.stock?.find((s) => (s.sucursal || '').toUpperCase() === branch);
  if (fromList) {
    if (fromList.cantidad != null && num(fromList.cantidad) > 0) return true;
    if (String(fromList.estado || '').toUpperCase() === 'ALTO' || String(fromList.estado || '').toUpperCase() === 'MEDIO') {
      return true;
    }
  }
  const flat =
    branch === 'NOA' ? p.stockNoa
      : branch === 'NEA' ? p.stockNea
        : branch === 'BUE' ? p.stockBue
          : p.stockCuy;
  return flat != null && num(flat) > 0;
}

function disponibleText(p: ProductoDTO): string {
  let s = '';
  if (stockPositive(p, 'NOA')) s += ' NOA';
  if (stockPositive(p, 'NEA')) s += ' NEA';
  if (stockPositive(p, 'BUE')) s += ' BUE';
  if (stockPositive(p, 'CUY')) s += ' CUY';
  return s.trim();
}

function isImportado(p: ProductoDTO): boolean {
  const v = p.importado as unknown;
  return v === true || v === 'S' || v === 's';
}

function hasVariacion(p: ProductoDTO): boolean {
  const v = (p as any).variacionPrecio ?? (p as any).conVariacionPrecio;
  return String(v || '').toUpperCase() === 'S';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Precio s/IVA coherente con el precio de venta c/IVA (misma alícuota o ratio lista).
 */
function deriveUnitSinIva(
  unitConIva: number,
  p: ProductoDTO,
  precioFinalArs: number,
): number {
  if (unitConIva <= 0) return 0;
  const ivaPct = num(p.iva);
  if (ivaPct > 0 && ivaPct < 100) {
    return round2(unitConIva / (1 + ivaPct / 100));
  }
  const bonifArs = num(p.precioBonificado);
  if (bonifArs > 0 && precioFinalArs > 0) {
    return round2(unitConIva * (bonifArs / precioFinalArs));
  }
  // Fallback típico 21%
  return round2(unitConIva / 1.21);
}

/**
 * Precios de exportación alineados a card/detalle:
 * resolvePreciosMoneda + resolveOfertaPrecios (+ markup público).
 */
export function prepareExportPrices(
  products: ProductoDTO[],
  opts: PreparePricesOpts,
): PreparedExportRow[] {
  const markup = Math.max(0, Number(opts.markupPercentage) || 0);
  const rows: PreparedExportRow[] = [];

  for (const p of products) {
    const precioFinalArs = num(p.precioFinalPeso ?? p.precioFinal ?? 0);
    if (precioFinalArs <= 0 && num(p.precioFinalDolar) <= 0) continue;

    const itemMoneda = String(p.moneda || 'ARS').toUpperCase();
    const cotItem = num(p.cotizacionUSD) || opts.cotizacionUSD;
    const displayCurrency: 'ARS' | 'USD' = opts.aplicaConversion
      ? opts.moneda
      : itemMoneda === 'USD'
        ? 'USD'
        : 'ARS';

    const {
      precioMostrar,
      precioListaMostrar,
      monedaAMostrar,
      tipoCambio,
    } = resolvePreciosMoneda({
      monedaProducto: p.moneda,
      currency: displayCurrency,
      precioFinalPeso: precioFinalArs,
      precioFinalDolar: p.precioFinalDolar,
      precioReferencia: p.precioReferencia,
      cotizacionUSD: cotItem > 0 ? cotItem : opts.cotizacionUSD,
    });

    if (precioMostrar <= 0) continue;

    const ofertaPrecios = resolveOfertaPrecios({
      enOferta: p.enOferta,
      itemProductoVentaEspeciales: p.itemProductoVentaEspeciales,
      precioMostrar,
      precioListaMostrar,
      bonificacion1: p.bonificacion,
      bonificacion2: p.bonificacion2,
      quantity: 1,
      monedaAMostrar,
      tipoCambio,
    });

    const unitConIva = ofertaPrecios.precioOfertaUnitario;
    if (unitConIva <= 0) continue;

    const unitSinIva = deriveUnitSinIva(unitConIva, p, precioFinalArs);
    const refOnline = precioListaMostrar > 0 ? precioListaMostrar : 0;
    // Misma base que la web (card): markup sobre precioMostrar (bonif.1), no sobre oferta
    const marcado = calcularPrecioPublico(precioMostrar, markup);

    rows.push({
      codigo: codigoOf(p),
      cantidad: '',
      nroParte: (p.nroParte || '').trim(),
      descripcion: (p.descripcion || '').trim(),
      tipo: (p.tipo || '').toString().trim(),
      subtipo: (p.subtipo || '').toString().trim(),
      marca: (p.marca || '').toString().trim(),
      presentacion: (p.unidadMedidaCatalogo || '').toString().trim(),
      presentacion2: (p.unidadConversionCatalogo || '').toString().trim(),
      disponible: disponibleText(p),
      origen: isImportado(p) ? 'Imp' : 'Nac',
      moneda: opts.aplicaConversion ? opts.moneda : itemMoneda,
      variacion: hasVariacion(p) ? 'Si' : 'No',
      unitSinIva,
      unitConIva,
      refOnline,
      marcado,
      conVariacion: hasVariacion(p),
    });
  }
  return rows;
}

function cellOf(row: PreparedExportRow, key: PrecioExportColumn): string | number {
  switch (key) {
    case 'codigo': return row.codigo;
    case 'cantidad': return row.cantidad;
    case 'nroParte': return row.nroParte;
    case 'descripcion': return row.descripcion;
    case 'tipo': return row.tipo;
    case 'subtipo': return row.subtipo;
    case 'marca': return row.marca;
    case 'presentacion': return row.presentacion;
    case 'presentacion2': return row.presentacion2;
    case 'disponible': return row.disponible;
    case 'origen': return row.origen;
    case 'moneda': return row.moneda;
    case 'variacion': return row.variacion;
    case 'unitSinIva': return row.unitSinIva;
    case 'unitConIva': return row.unitConIva;
    case 'refOnline': return row.refOnline;
    case 'marcado': return row.marcado;
    default: return '';
  }
}

function fmtMoney(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type DownloadMeta = {
  clienteNombre: string;
  cotizacionUSD: number;
  markupPercentage: number;
};

const DISCLAIMER =
  '* Las variaciones de precios informadas corresponden a los últimos 30 días *';

/** Estilos legacy (ExportadorBean): títulos de columna con fondo gris claro. */
const GRAY_HEADER_FILL = { patternType: 'solid' as const, fgColor: { rgb: 'D9D9D9' } };
const YELLOW_FILL = { patternType: 'solid' as const, fgColor: { rgb: 'FFFF00' } };
const TITLE_FONT = { name: 'Trebuchet MS', sz: 14, bold: true };
const META_FONT = { name: 'Trebuchet MS', sz: 12 };
const ALERT_FONT = { name: 'Trebuchet MS', sz: 10 };
const TABLE_HEADER_FONT = {
  name: 'Trebuchet MS',
  sz: 10,
  bold: true,
  color: { rgb: '404040' },
};
const FOOTER_FONT = { name: 'Trebuchet MS', sz: 10 };

const COL_WIDTHS: Partial<Record<PrecioExportColumn, number>> = {
  codigo: 14,
  cantidad: 10,
  nroParte: 18,
  descripcion: 48,
  tipo: 14,
  subtipo: 14,
  marca: 14,
  presentacion: 12,
  presentacion2: 14,
  disponible: 14,
  origen: 8,
  moneda: 8,
  variacion: 12,
  unitSinIva: 14,
  unitConIva: 14,
  refOnline: 16,
  marcado: 16,
};

export function downloadPreciosXlsx(
  rows: PreparedExportRow[],
  columns: PrecioExportColumn[],
  meta: DownloadMeta,
  filename?: string,
) {
  const cols = columns.length
    ? PRECIO_EXPORT_COLUMNS.filter((c) => columns.includes(c.key))
    : PRECIO_EXPORT_COLUMNS;
  const headers = cols.map((c) => c.label);
  const body = rows.map((r) =>
    cols.map((c) => {
      const v = cellOf(r, c.key);
      if (typeof v === 'number' && ['unitSinIva', 'unitConIva', 'refOnline', 'marcado'].includes(c.key)) {
        return fmtMoney(v);
      }
      return v;
    }),
  );

  const fecha = new Date().toLocaleDateString('es-AR');
  const metaRows: (string | number)[][] = [
    ['INTERCAP S.R.L.'],
    [],
    [`Cliente: ${meta.clienteNombre}`],
    [`Fecha creación: ${fecha}`],
    [`Cotización actual dolar: ${meta.cotizacionUSD}`],
    [`Porcentaje marcación: ${meta.markupPercentage} %`],
    [],
    [DISCLAIMER],
    [],
  ];
  const headerRowIndex = metaRows.length; // 0-based
  const aoa: (string | number)[][] = [
    ...metaRows,
    headers,
    ...body,
    [],
    [],
    ['Las existencias informadas son de caracter orientativo.'],
    [
      'A fin de corroborar los datos brindados, sírvase confirmarlos en nuestras oficinas, via e-mail o telefónicamente',
    ],
    [],
    ['Los datos de la columna Presentacion son de caracter informativo.'],
    [
      'Es preciso tener en cuenta que algunas provincias tienen instrumentados regímenes de percepciones que podrían incrementar',
    ],
    ['el valor en función de las alícuotas que resulten de aplicación.'],
    [],
    [DISCLAIMER],
    [],
    ['INTERCAP S.R.L.'],
  ];

  const bodyEndExclusive = headerRowIndex + 1 + body.length;
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const styleCell = (addr: string, style: Record<string, unknown>) => {
    const cell = ws[addr];
    if (cell) cell.s = style;
  };

  // Cabecera legacy
  styleCell('A1', { font: TITLE_FONT, alignment: { horizontal: 'center' } });
  for (const r of [3, 4, 5, 6]) {
    styleCell(`A${r}`, { font: META_FONT, alignment: { horizontal: 'center' } });
  }
  styleCell('A8', {
    font: ALERT_FONT,
    fill: YELLOW_FILL,
    alignment: { horizontal: 'left' },
  });

  // Fila de títulos: fondo gris claro
  cols.forEach((_, colIdx) => {
    const addr = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIdx });
    styleCell(addr, {
      font: TABLE_HEADER_FONT,
      fill: GRAY_HEADER_FILL,
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'BFBFBF' } },
        bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
        left: { style: 'thin', color: { rgb: 'BFBFBF' } },
        right: { style: 'thin', color: { rgb: 'BFBFBF' } },
      },
    });
  });

  // Pie legacy
  const footerInfoRows = [
    bodyEndExclusive + 2,
    bodyEndExclusive + 3,
    bodyEndExclusive + 5,
    bodyEndExclusive + 6,
    bodyEndExclusive + 7,
  ];
  for (const r of footerInfoRows) {
    styleCell(`A${r + 1}`, { font: FOOTER_FONT });
  }
  styleCell(`A${bodyEndExclusive + 10}`, {
    font: ALERT_FONT,
    fill: YELLOW_FILL,
  });
  styleCell(`A${bodyEndExclusive + 12}`, {
    font: TITLE_FONT,
    alignment: { horizontal: 'center' },
  });

  const lastCol = Math.max(cols.length - 1, 7);
  if (!ws['!merges']) ws['!merges'] = [];
  for (const r of [0, 2, 3, 4, 5, 7]) {
    ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: lastCol } });
  }
  for (let r = bodyEndExclusive; r < aoa.length; r++) {
    if (aoa[r]?.[0]) {
      ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: lastCol } });
    }
  }

  ws['!cols'] = cols.map((c) => ({ wch: COL_WIDTHS[c.key] ?? 12 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Precios Intercap');
  const name = filename || `catalogo_${fecha.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, name);
}

const PDF_COLUMNS: PrecioExportColumn[] = [
  'codigo',
  'descripcion',
  'moneda',
  'unitSinIva',
  'unitConIva',
  'marcado',
];

export function downloadPreciosPdf(
  rows: PreparedExportRow[],
  meta: DownloadMeta,
  filename?: string,
) {
  const cols = PRECIO_EXPORT_COLUMNS.filter((c) => PDF_COLUMNS.includes(c.key));
  const headers = cols.map((c) => c.label);
  const body = rows.map((r) =>
    cols.map((c) => {
      const v = cellOf(r, c.key);
      return typeof v === 'number' ? fmtMoney(v) : String(v);
    }),
  );

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(0, 31, 63);
  doc.rect(0, 0, pageW, 52, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERCAP S.R.L.', 40, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Cliente: ${meta.clienteNombre}  |  Cotiz. USD: ${meta.cotizacionUSD}  |  Marcación: ${meta.markupPercentage}%`,
    40,
    40,
  );

  autoTable(doc, {
    head: [headers],
    body,
    startY: 60,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [0, 31, 63], textColor: 255 },
    margin: { left: 24, right: 24, bottom: 36 },
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text(`Intercap — Página ${i} de ${total}`, pageW / 2, doc.internal.pageSize.getHeight() - 12, {
      align: 'center',
    });
  }

  const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
  doc.save(filename || `catalogo_${fecha}.pdf`);
}

/** Construye query de catálogo igual que CatalogGrid (sin page/size). */
export function buildCatalogSearchParamsFromUrl(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  nrocta: string,
): URLSearchParams {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined;
    }
    const v = searchParams[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const p = new URLSearchParams();
  const map: Record<string, string> = {
    rubro: 'rubro',
    subtipo: 'subtipo',
    tipo: 'tipo',
    marca: 'marca',
    q: 'q',
    tippro: 'tippro',
    artcod: 'artcod',
    sortBy: 'sortBy',
    sortOrder: 'sortOrder',
  };
  for (const [from, to] of Object.entries(map)) {
    const v = get(from);
    if (v) p.set(to, v);
  }
  if (get('fabricante')) p.set('appFabricante', get('fabricante')!);
  if (get('modelo')) p.set('appModelo', get('modelo')!);
  if (get('cilindrada')) p.set('appCilindrada', get('cilindrada')!);
  if (get('version')) p.set('appVersion', get('version')!);
  if (get('anio')) p.set('annios', get('anio')!);
  if (get('nroPool')) {
    p.set('nroPool', get('nroPool')!);
    p.set('ofertas', 'true');
  }
  for (const key of ['ofertas', 'novedades', 'stockDisponible', 'variacionPrecio', 'stockBue', 'stockCuy', 'stockNea', 'stockNoa'] as const) {
    const v = get(key);
    if (v === 'true') p.set(key, 'true');
  }

  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((val, key) => {
      if (key.startsWith('attr_') && val) p.append(key, val);
    });
  } else {
    Object.keys(searchParams).forEach((key) => {
      if (!key.startsWith('attr_')) return;
      const val = searchParams[key];
      if (Array.isArray(val)) val.forEach((v) => p.append(key, v));
      else if (val) p.append(key, val);
    });
  }

  if (nrocta) p.set('nrocta', nrocta);
  return p;
}

export async function fetchCatalogForExport(opts: {
  token: string;
  nrocta: string;
  mode: DatosExportScope;
  /** URL params actuales del catálogo (modo A). */
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined>;
  pageSize?: number;
  onProgress?: (loaded: number, total: number) => void;
}): Promise<ProductoDTO[]> {
  const size = opts.pageSize ?? 500;
  const all: ProductoDTO[] = [];
  let page = 0;
  let totalPages = 1;
  let totalElements = 0;

  while (page < totalPages) {
    let params: URLSearchParams;
    if (opts.mode === 'A' && opts.searchParams) {
      params = buildCatalogSearchParamsFromUrl(opts.searchParams, opts.nrocta);
    } else {
      params = new URLSearchParams();
      if (opts.nrocta) params.set('nrocta', opts.nrocta);
    }
    params.set('page', String(page));
    params.set('size', String(size));

    const res = await fetch(`/api/catalogo/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${opts.token}` },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Error al cargar catálogo (${res.status})`);
    const data = await res.json();
    const list: ProductoDTO[] = Array.isArray(data?.content) ? data.content : [];
    all.push(...list);
    // Spring Data Page: { content, page: { totalPages, totalElements, ... } }
    const pageMeta = data?.page ?? data;
    totalPages = Number(pageMeta?.totalPages ?? data?.totalPages ?? 1) || 1;
    totalElements =
      Number(pageMeta?.totalElements ?? data?.totalElements ?? all.length) || all.length;
    opts.onProgress?.(all.length, totalElements);
    page += 1;
    if (list.length === 0) break;
  }
  return all;
}

/** Cotización USD promedio de la primera página de productos (o 0). */
export function extractCotizacionUSD(products: ProductoDTO[]): number {
  for (const p of products) {
    const c = num(p.cotizacionUSD);
    if (c > 0) return c;
  }
  return 0;
}

// --- Compat con /exportar anterior (reexport mínimo) ---
export type ExportColumnKey =
  | 'codigo'
  | 'descripcion'
  | 'marca'
  | 'tipo'
  | 'nroParte'
  | 'precio'
  | 'stockNoa'
  | 'stockNea'
  | 'stockBue'
  | 'stockCuy'
  | 'stockTotal';

export const EXPORT_COLUMN_OPTS: { key: ExportColumnKey; label: string; priceOnly?: boolean }[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'marca', label: 'Marca' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'nroParte', label: 'Nº parte' },
  { key: 'precio', label: 'Precio', priceOnly: true },
];

export async function fetchAllCatalogProducts(opts: {
  token: string;
  nrocta?: string | null;
  pageSize?: number;
  onProgress?: (loaded: number, total: number) => void;
}): Promise<ProductoDTO[]> {
  return fetchCatalogForExport({
    token: opts.token,
    nrocta: opts.nrocta || '',
    mode: 'C',
    pageSize: opts.pageSize,
    onProgress: opts.onProgress,
  });
}

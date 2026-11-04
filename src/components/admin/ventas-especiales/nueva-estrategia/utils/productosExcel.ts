import * as XLSX from 'xlsx';

export type ProductoExcelRow = {
  sku: string;
  descripcion: string;
  cantidad: number;
  dtoPct: number;
};

function normalizeHeader(cell: unknown): string {
  return String(cell ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

function cellToSku(cell: unknown): string {
  if (cell == null || cell === '') return '';
  if (typeof cell === 'number' && Number.isFinite(cell)) {
    return String(Math.trunc(cell));
  }
  return String(cell).trim();
}

function parseDecimalCell(cell: unknown): number {
  if (cell == null || cell === '') return 0;
  if (typeof cell === 'number' && Number.isFinite(cell)) return cell;
  const raw = String(cell).trim();
  if (!raw) return 0;
  const compact = raw.replace(/\s+/g, '');
  const normalized =
    compact.includes(',') && compact.includes('.')
      ? compact.replace(/\./g, '').replace(',', '.')
      : compact.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIntegerCell(cell: unknown): number {
  const n = parseDecimalCell(cell);
  return Math.max(0, Math.trunc(n));
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h === candidate || h.includes(candidate));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function parseProductosExcelFile(file: ArrayBuffer): ProductoExcelRow[] {
  const workbook = XLSX.read(file, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo no tiene hojas');
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  if (rows.length < 2) {
    throw new Error('El archivo debe tener encabezados y al menos una fila de datos');
  }

  const headerRow = rows[0].map(normalizeHeader);
  const skuIdx = findColumnIndex(headerRow, ['SKU', 'CODIGO', 'CODIGO INTERNO', 'CODIGO PRODUCTO']);
  const descIdx = findColumnIndex(headerRow, ['DESCRIPCION', 'DESCRIPCIÓN', 'PRODUCTO']);
  const cantIdx = findColumnIndex(headerRow, ['CANTIDAD', 'STOCK', 'STOCK OFERTA', 'CNT']);
  const dtoIdx = findColumnIndex(headerRow, ['% DESCUENTO', 'DESCUENTO', 'DTO', 'PDSCTO']);

  if (skuIdx < 0) {
    throw new Error('No se encontró la columna SKU en la primera fila');
  }
  if (cantIdx < 0) {
    throw new Error('No se encontró la columna CANTIDAD en la primera fila');
  }
  if (dtoIdx < 0) {
    throw new Error('No se encontró la columna % DESCUENTO en la primera fila');
  }

  const result: ProductoExcelRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const sku = cellToSku(row[skuIdx]);
    if (!sku) continue;
    const descripcion = descIdx >= 0 ? String(row[descIdx] ?? '').trim() : '';
    const cantidad = parseIntegerCell(row[cantIdx]);
    const dtoPct = parseDecimalCell(row[dtoIdx]);
    result.push({ sku, descripcion, cantidad, dtoPct });
  }

  if (result.length === 0) {
    throw new Error('No se encontraron filas con SKU válido');
  }

  return result;
}

export function downloadProductosPlantillaExcel(): void {
  const ws = XLSX.utils.aoa_to_sheet([
    ['SKU', 'DESCRIPCION', 'CANTIDAD', '% DESCUENTO'],
    ['001001270023', '130/70-17 M/C 62P TL UB-2203 MONSTER STREET DURTEC TIRES', 20, 15],
    ['012001010051', 'BATERIA BOSCH BB4LB GILERA F110/ HONDA S70/CRF70/ ZANELLA HOT', 50, 20.5],
    ['012004050009', '130/70-17 M/C 62S TL D604 DUNLOP TIRES', 36, 10],
    ['002001010005', 'BATERIA BOSCH BB4LB GILERA F110/ HONDA S70/CRF70/ ZANELLA HOT', 60, 25],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'plantilla-productos-oferta.xlsx');
}

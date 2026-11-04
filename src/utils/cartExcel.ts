import * as XLSX from 'xlsx';

/** Tope legacy de filas de productos a importar (sin contar header). */
export const CART_IMPORT_MAX_ROWS = 300;

export type CartExcelRow = {
  codigo: string;
  cantidad: number;
  /** Fila Excel 1-based (incluye header). */
  row: number;
};

export type CartExcelLocalError = {
  row: number;
  codigo: string;
  message: string;
};

function normalizeHeader(cell: unknown): string {
  return String(cell ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

function cellToCodigo(cell: unknown): string {
  if (cell == null || cell === '') return '';
  if (typeof cell === 'number' && Number.isFinite(cell)) {
    return padCodigo12(String(Math.trunc(cell)));
  }
  let raw = String(cell).trim().replace(/^\uFEFF/, '');
  if (!raw) return '';
  // Excel a veces entrega notación científica ("1.001270004e+9")
  if (/e\+/i.test(raw)) {
    const asNum = Number(raw);
    if (Number.isFinite(asNum)) {
      return padCodigo12(String(Math.trunc(asNum)));
    }
  }
  if (/^\d+$/.test(raw)) {
    return padCodigo12(raw);
  }
  return raw;
}

function padCodigo12(digits: string): string {
  if (digits.length >= 12) return digits;
  return digits.padStart(12, '0');
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

function isBlankHeader(cell: unknown): boolean {
  return String(cell ?? '').trim() === '';
}

/** Valida filas parseadas y devuelve motivos locales (código vacío, cantidad inválida). */
export function validateCartExcelRows(rows: CartExcelRow[]): CartExcelLocalError[] {
  const errors: CartExcelLocalError[] = [];
  for (const r of rows) {
    if (!r.codigo?.trim()) {
      errors.push({ row: r.row, codigo: '', message: 'Código vacío' });
      continue;
    }
    if (!r.cantidad || r.cantidad <= 0) {
      errors.push({
        row: r.row,
        codigo: r.codigo,
        message: 'Cantidad inválida (debe ser mayor a 0)',
      });
    }
  }
  return errors;
}

export function parseCartExcelFile(
  file: ArrayBuffer,
  maxRows: number = CART_IMPORT_MAX_ROWS,
): CartExcelRow[] {
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

  const rawHeader = rows[0] ?? [];
  // Legacy: no columnas en blanco al principio
  if (rawHeader.length > 0 && isBlankHeader(rawHeader[0])) {
    throw new Error('No debe tener columnas en blanco al principio');
  }

  const headerRow = rawHeader.map(normalizeHeader);
  const codigoIdx = findColumnIndex(headerRow, ['CODIGO', 'CÓDIGO', 'SKU', 'CODIGO PRODUCTO']);
  const cantIdx = findColumnIndex(headerRow, ['CANTIDAD', 'CANT', 'CNT', 'QTY']);

  if (codigoIdx < 0) {
    throw new Error('No se encontró la columna Codigo en la primera fila');
  }
  if (cantIdx < 0) {
    throw new Error('No se encontró la columna Cantidad en la primera fila');
  }
  // Legacy recomienda Código/Cantidad al inicio; si están por nombre en otras
  // columnas igual importamos (p.ej. archivo con Descripcion extra reordenada).
  // Solo bloqueamos si la primera columna está en blanco (ya validado arriba).

  const result: CartExcelRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const codigo = cellToCodigo(row[codigoIdx]);
    const cantidad = parseIntegerCell(row[cantIdx]);
    // Conservar filas con algún dato para poder reportar motivo (código vacío / cantidad)
    if (!codigo && cantidad <= 0) continue;
    result.push({ codigo, cantidad, row: i + 1 });
  }

  if (result.length === 0) {
    throw new Error('No se encontraron filas con datos para importar');
  }

  if (result.length > maxRows) {
    throw new Error(
      `El archivo no debe poseer más de ${maxRows} filas con los productos a importar`,
    );
  }

  return result;
}

export function downloadCartPlantillaExcel(): void {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Codigo', 'Cantidad'],
    ['001001010001', 10],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'productos_importar.xlsx');
}

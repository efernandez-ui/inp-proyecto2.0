import * as XLSX from 'xlsx';

export type ClienteExcelRow = {
  nrocta: string;
  razonSocial: string;
};

function normalizeHeader(cell: unknown): string {
  return String(cell ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

function cellToNrocta(cell: unknown): string {
  if (cell == null || cell === '') return '';
  if (typeof cell === 'number' && Number.isFinite(cell)) {
    return String(Math.trunc(cell));
  }
  return String(cell).trim();
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h === candidate || h.includes(candidate));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function parseClientesExcelFile(file: ArrayBuffer): ClienteExcelRow[] {
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
  const nroctaIdx = findColumnIndex(headerRow, ['NROCTA', 'NRO CTA', 'CUENTA', 'NRO CUENTA']);
  const razonIdx = findColumnIndex(headerRow, [
    'RAZON SOCIAL',
    'RAZON',
    'NOMBRE',
    'CLIENTE',
    'DENOMINACION',
  ]);

  if (nroctaIdx < 0) {
    throw new Error('No se encontró la columna NROCTA en la primera fila');
  }

  const result: ClienteExcelRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const nrocta = cellToNrocta(row[nroctaIdx]);
    if (!nrocta) continue;
    const razonSocial =
      razonIdx >= 0 ? String(row[razonIdx] ?? '').trim() : '';
    result.push({ nrocta, razonSocial });
  }

  if (result.length === 0) {
    throw new Error('No se encontraron filas con NROCTA válido');
  }

  return result;
}

export function downloadClientesPlantillaExcel(): void {
  const ws = XLSX.utils.aoa_to_sheet([
    ['NROCTA', 'RAZÓN SOCIAL'],
    ['000014', 'ACOSTA, JULIO'],
    ['000050', 'RI-AL MOTOS SA'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, 'plantilla-clientes-segmentacion.xlsx');
}

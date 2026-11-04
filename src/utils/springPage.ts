export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

function extractContent<T>(root: Record<string, unknown>): T[] {
  if (Array.isArray(root.content)) return root.content as T[];
  const nested = asRecord(root.page);
  if (nested && Array.isArray(nested.content)) return nested.content as T[];
  return [];
}

/** Spring Boot 3.5+ puede serializar Page como `{ content, page: { totalElements, ... } }`. */
export function normalizeSpringPage<T>(raw: unknown): SpringPage<T> {
  if (Array.isArray(raw)) {
    const content = raw as T[];
    return {
      content,
      totalElements: content.length,
      totalPages: content.length > 0 ? 1 : 0,
      number: 0,
      size: content.length,
      first: true,
      last: true,
    };
  }

  const o = asRecord(raw);
  if (!o) {
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

  const content = extractContent<T>(o);
  const nested = asRecord(o.page);

  const totalElements = nested
    ? num(nested.totalElements, content.length)
    : num(o.totalElements, content.length);
  const totalPages = nested ? num(nested.totalPages, 0) : num(o.totalPages, 0);
  const number = nested ? num(nested.number, 0) : num(o.number, 0);
  const size = nested
    ? num(nested.size, content.length || 10)
    : num(o.size, content.length || 10);

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

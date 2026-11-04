export const PRODUCT_PLACEHOLDER = '/images/placeholder-generic.svg';
export const PRODUCT_PLACEHOLDER_SMALL = '/images/placeholder-generic-small.svg';

/**
 * True solo si la URL de imagen es usable: rechaza vacíos, el string "null"/"undefined"
 * y URLs ya rotas terminadas en /null.jpg (generadas al concatenar un path nulo).
 */
export function isValidProductImageUrl(url: unknown): url is string {
  if (!url || typeof url !== 'string') return false;
  const v = url.trim();
  if (!v) return false;
  const lower = v.toLowerCase();
  if (lower === 'null' || lower === 'undefined') return false;
  if (
    lower.endsWith('/null') ||
    lower.endsWith('/null.jpg') ||
    lower.endsWith('/null.jpeg') ||
    lower.endsWith('/null.png') ||
    lower === 'null.jpg' ||
    lower === 'null.jpeg' ||
    lower === 'null.png'
  ) {
    return false;
  }
  return true;
}

/** Devuelve la URL si es válida; si no, cadena vacía. */
export function sanitizeProductImageUrl(url: unknown): string {
  return isValidProductImageUrl(url) ? (url as string).trim() : '';
}

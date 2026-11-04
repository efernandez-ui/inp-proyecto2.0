/** Extrae mensaje legible desde errores de API, Redux rejectWithValue o Error. */
export function extractErrorMessage(error: unknown, fallback = 'Error inesperado'): string {
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage.trim();
    }
  }
  return fallback;
}

/** Separa mensajes de checkout legacy (título + ítems separados por |). */
export function parseCheckoutErrors(message: string): { title: string; items: string[] } {
  const cleaned = message.trim();
  if (!cleaned) {
    return { title: 'No se pudo confirmar el pedido', items: [] };
  }

  const colonIdx = cleaned.indexOf(':');
  const title = colonIdx > 0 ? cleaned.slice(0, colonIdx).trim() : 'No se pudo confirmar el pedido';
  const body = colonIdx > 0 ? cleaned.slice(colonIdx + 1) : cleaned;

  const items = body
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^\*\s*/, ''));

  return {
    title,
    items: items.length > 0 ? items : [cleaned],
  };
}

export async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const raw = (await response.text()).trim();
  if (!raw) return fallback;

  try {
    const json = JSON.parse(raw) as { message?: string; error?: string };
    if (typeof json.message === 'string' && json.message.trim()) return json.message.trim();
    if (typeof json.error === 'string' && json.error.trim()) return json.error.trim();
  } catch {
    // respuesta plain text del backend
  }

  return raw;
}

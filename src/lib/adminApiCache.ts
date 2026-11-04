type Entry = { expires: number; data: unknown };

const store = new Map<string, Entry>();

export const ADMIN_CACHE_KEYS = {
  parametros: 'admin:parametros',
  ventasEspeciales: 'admin:ventas-especiales',
  correosNoEnviados: 'admin:correos-no-enviados',
  ventaEspecial: (nrpool: number) => `admin:venta-especial:${nrpool}`,
} as const;

export async function adminCacheGet<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) {
    return hit.data as T;
  }
  const data = await loader();
  store.set(key, { data, expires: now + ttlMs });
  return data;
}

export function adminCacheInvalidate(keyOrPrefix: string) {
  for (const k of [...store.keys()]) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) {
      store.delete(k);
    }
  }
}

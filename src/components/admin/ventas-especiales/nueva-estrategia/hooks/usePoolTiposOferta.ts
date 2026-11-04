'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPoolTiposOferta, type TipoOfertaPool } from '@/services/admin';

export function usePoolTiposOferta() {
  const [tipos, setTipos] = useState<TipoOfertaPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getPoolTiposOferta();
      setTipos(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tipos');
      setTipos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tipos, loading, error, reload };
}

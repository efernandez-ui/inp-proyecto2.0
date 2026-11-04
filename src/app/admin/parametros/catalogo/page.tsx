'use client';

import { useEffect, useState } from 'react';
import { getParametrosCatalogo, postAdminSync, postCatalogoAccion, putParametrosCatalogo, type SyncRunResponse } from '@/services/admin';
import { ParametroField, ParametroTextInput } from '@/components/admin/parametros/ParametroField';
import { toast } from 'react-toastify';
import { RefreshCw, DatabaseZap } from 'lucide-react';

/** Minutos del schedule de productos en logstash/pipeline/productos.conf ("0,20,40 * * * *"). */
const PRODUCTOS_SYNC_MINUTOS = [0, 20, 40];

function proximaSyncProductos(now: Date): Date {
  const next = new Date(now);
  next.setSeconds(0, 0);
  const m = PRODUCTOS_SYNC_MINUTOS.find((min) => min > now.getMinutes());
  if (m === undefined) next.setHours(next.getHours() + 1, PRODUCTOS_SYNC_MINUTOS[0]);
  else next.setMinutes(m);
  return next;
}

function ProximaSyncProductos({ className = 'mt-3' }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return null;

  const next = proximaSyncProductos(now);
  const restante = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const mm = String(Math.floor(restante / 60)).padStart(2, '0');
  const ss = String(restante % 60).padStart(2, '0');
  const hora = next.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <p className={`${className} text-xs font-bold text-[#001f3f]`}>
      Próxima sincronización automática de productos: {hora} (faltan {mm}:{ss})
    </p>
  );
}

export default function ParametrosCatalogoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [path, setPath] = useState('');
  const [syncing, setSyncing] = useState<Partial<Record<SyncRunResponse['target'], boolean>>>({});
  const [confirmar, setConfirmar] = useState<SyncRunResponse['target'] | null>(null);

  useEffect(() => {
    let c = false;
    setLoading(true);
    getParametrosCatalogo()
      .then((p) => {
        if (!c) setPath(p.pathImagenesProductos ?? '');
      })
      .catch(() => toast.error('No se pudo cargar'))
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  const guardar = async () => {
    setSaving(true);
    try {
      const saved = await putParametrosCatalogo({ pathImagenesProductos: path });
      setPath(saved.pathImagenesProductos ?? '');
      toast.success('Guardado');
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const accion = async (tipo: Parameters<typeof postCatalogoAccion>[0]) => {
    try {
      const message = await postCatalogoAccion(tipo);
      toast.success(message || 'Listo');
    } catch (e) {
      toast.warning(e instanceof Error ? e.message : 'No disponible');
    }
  };

  /** Abre el popup de confirmación; la ejecución real es {@link ejecutarSync}. */
  const sync = (target: SyncRunResponse['target']) => {
    if (syncing[target]) return;
    setConfirmar(target);
  };

  const ejecutarSync = async (target: SyncRunResponse['target']) => {
    setConfirmar(null);
    if (syncing[target]) return;
    setSyncing((m) => ({ ...m, [target]: true }));
    try {
      const r = await postAdminSync(target);
      const detail =
        r.message && r.message !== 'OK'
          ? r.message
          : `${r.saved}/${r.processed}`;
      toast.success(`Sync ${r.target}: ${detail} en ${(r.elapsedMs / 1000).toFixed(1)}s`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo sincronizar');
    } finally {
      setSyncing((m) => ({ ...m, [target]: false }));
    }
  };

  if (loading) {
    return <div className="text-sm font-bold text-gray-500">Cargando…</div>;
  }

  const btn =
    'inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[#001f3f] ring-1 ring-gray-200 hover:bg-white';

  return (
    <div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ParametroField label="Path imágenes productos">
          <ParametroTextInput value={path} onChange={setPath} />
        </ParametroField>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Actualizaciones</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" className={btn} onClick={() => accion('actualizar-precios')}>
            <RefreshCw className="h-4 w-4 text-[#0e8c85]" />
            Actualizar precios
          </button>
          <button type="button" className={btn} onClick={() => accion('actualizar-productos-oferta')}>
            <RefreshCw className="h-4 w-4 text-[#0e8c85]" />
            Productos en oferta
          </button>
          <button type="button" className={btn} onClick={() => accion('actualizar-visibilidad-productos')}>
            <RefreshCw className="h-4 w-4 text-[#0e8c85]" />
            Visibilidad productos
          </button>
          <button type="button" className={btn} onClick={() => accion('actualizar-aplicaciones-productos')}>
            <RefreshCw className="h-4 w-4 text-[#0e8c85]" />
            Aplicaciones productos
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Sincronización manual (Elasticsearch)</h2>
        <p className="mt-2 text-xs font-medium text-gray-500">
          Ejecuta la extracción desde SQL y reindexa en Elasticsearch (equivalente a esperar los pipelines programados de Logstash).
          No arranca contenedores de Logstash ni Kibana: solo la API del backend escribe en el índice.
        </p>
        <p className="mt-1 text-xs font-medium text-gray-500">
          Automático: productos cada 20 min (hh:00, hh:20, hh:40). Atributos 2:00, aplicaciones 3:00, presentaciones 3:15,
          imágenes 3:30 y listas home 4:00. Además corren, sin cambios: excepciones 1:00, ofertas cada hora,
          cotización USD 19:00 y coeficientes de tarjetas 23:00.
        </p>
        <ProximaSyncProductos />
        {confirmar && (
          <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-base font-black uppercase tracking-tight text-[#001f3f]">
                Sincronizar {confirmar}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Se va a reindexar en Elasticsearch desde SQL. ¿Querés ejecutarlo ahora?
              </p>
              <ProximaSyncProductos className="mt-3" />
              {confirmar === 'productos' && (
                <p className="mt-1 text-xs text-gray-500">
                  Si falta poco, conviene esperar a la sincronización automática.
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmar(null)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold uppercase text-[#001f3f] ring-1 ring-gray-200 hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => ejecutarSync(confirmar)}
                  className="rounded-xl bg-[#001f3f] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#002a55]"
                >
                  Ejecutar
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" className={btn} disabled={!!syncing.productos} onClick={() => sync('productos')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.productos ? 'Sincronizando…' : 'Productos'}
          </button>
          <button type="button" className={btn} disabled={!!syncing.atributos} onClick={() => sync('atributos')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.atributos ? 'Sincronizando…' : 'Atributos'}
          </button>
          <button type="button" className={btn} disabled={!!syncing.aplicaciones} onClick={() => sync('aplicaciones')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.aplicaciones ? 'Sincronizando…' : 'Aplicaciones'}
          </button>
          <button type="button" className={btn} disabled={!!syncing.presentaciones} onClick={() => sync('presentaciones')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.presentaciones ? 'Sincronizando…' : 'Presentaciones'}
          </button>
          <button type="button" className={btn} disabled={!!syncing.imagenes} onClick={() => sync('imagenes')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.imagenes ? 'Sincronizando…' : 'Imágenes'}
          </button>
          <button type="button" className={btn} disabled={!!syncing.videos} onClick={() => sync('videos')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.videos ? 'Sincronizando…' : 'Videos'}
          </button>
          <button type="button" className={btn} disabled={!!syncing.vinculados} onClick={() => sync('vinculados')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.vinculados ? 'Sincronizando…' : 'Sustitutos y relacionados'}
          </button>
          <button type="button" className={btn} disabled={!!syncing.excepciones} onClick={() => sync('excepciones')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.excepciones ? 'Sincronizando…' : 'Excepciones'}
          </button>
          <button type="button" className={btn} disabled={!!syncing.ofertas} onClick={() => sync('ofertas')}>
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing.ofertas ? 'Sincronizando…' : 'Ofertas (ventas especiales)'}
          </button>
          <button
            type="button"
            className={btn}
            disabled={!!syncing['coeficientes-tarjetas']}
            onClick={() => sync('coeficientes-tarjetas')}
          >
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing['coeficientes-tarjetas'] ? 'Sincronizando…' : 'Coeficientes tarjetas (INPay)'}
          </button>
          <button
            type="button"
            className={btn}
            disabled={!!syncing['cotizacion-dolar']}
            onClick={() => sync('cotizacion-dolar')}
          >
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing['cotizacion-dolar'] ? 'Sincronizando…' : 'Cotización USD'}
          </button>
          <button
            type="button"
            className={btn}
            disabled={!!syncing['home-curated-lists']}
            onClick={() => sync('home-curated-lists')}
          >
            <DatabaseZap className="h-4 w-4 text-[#0e8c85]" />
            {syncing['home-curated-lists'] ? 'Sincronizando…' : 'Listas home (recomendadas, destacadas, ultimos ingresos)'}
          </button>
        </div>
      </section>

      <div className="mt-8 flex justify-end border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={guardar}
          disabled={saving}
          className="rounded-xl bg-[#0e8c85] px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

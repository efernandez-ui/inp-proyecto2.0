'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getOfertaEstadisticas,
  getVentaEspecialEdicion,
  updateVentaEspecialEdicion,
  type OfertaEstadisticas,
  type VentaEspecialEdicionDetalle,
} from '@/services/admin';
import { OfertaEstadisticasPanel } from '@/components/admin/ventas-especiales/OfertaEstadisticasPanel';
import { toast } from 'react-toastify';
import {
  VentaEspecialEditProductosTable,
  type EdicionProductoRow,
} from '@/components/admin/ventas-especiales/edit/VentaEspecialEditProductosTable';
import {
  VentaEspecialEditVigenciaFields,
  type VentaEspecialEditVigenciaValue,
} from '@/components/admin/ventas-especiales/edit/VentaEspecialEditVigenciaFields';
import { VentaEspecialEditContextoReadonly } from '@/components/admin/ventas-especiales/edit/VentaEspecialEditContextoReadonly';
import type { OfertaProductoSeleccionado } from '@/components/admin/ventas-especiales/nueva-estrategia/utils/productoOfertaMetrics';

type Props = { nrpool: number };

function formatDateForInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const normalized = iso.includes('T') ? iso : iso.replace(' ', 'T');
  return normalized.slice(0, 16);
}

function mapDetalleToForm(detalle: VentaEspecialEdicionDetalle): {
  vigencia: VentaEspecialEditVigenciaValue;
  items: EdicionProductoRow[];
} {
  return {
    vigencia: {
      disdes: formatDateForInput(detalle.disponibleDesde),
      dishas: formatDateForInput(detalle.disponibleHasta),
      descripcion: detalle.descripcion ?? '',
      observaciones: detalle.observaciones ?? '',
      estado: detalle.estado ?? '',
      pathBanner: detalle.pathBanner ?? '',
    },
    items: (detalle.productos ?? []).map((p) => ({
      ...p,
      cantidadTotal: Number(p.cantidadTotal ?? 0),
      cantidadDisponible: Number(p.cantidadDisponible ?? 0),
      cantidadReservada: Number(p.cantidadReservada ?? 0),
      cantidadConsumida: Number(p.cantidadConsumida ?? 0),
      porcentajeDescuento: Number(p.porcentajeDescuento ?? 0),
      precioLista: p.precioLista != null ? Number(p.precioLista) : null,
      precioOferta: p.precioOferta != null ? Number(p.precioOferta) : null,
    })),
  };
}

export function AdminVentaEspecialEditSection({ nrpool }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detalle, setDetalle] = useState<VentaEspecialEdicionDetalle | null>(null);
  const [vigencia, setVigencia] = useState<VentaEspecialEditVigenciaValue>({
    disdes: '',
    dishas: '',
    descripcion: '',
    observaciones: '',
    estado: '',
    pathBanner: '',
  });
  const [items, setItems] = useState<EdicionProductoRow[]>([]);
  const [nuevos, setNuevos] = useState<OfertaProductoSeleccionado[]>([]);
  const [stats, setStats] = useState<OfertaEstadisticas | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Estadísticas del pool (panel de diseño) — carga independiente de la edición.
  useEffect(() => {
    if (!Number.isFinite(nrpool) || nrpool <= 0) return;
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);
    getOfertaEstadisticas(nrpool)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setStats(null);
          setStatsError(e instanceof Error ? e.message : 'Error al cargar estadísticas');
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nrpool]);

  useEffect(() => {
    if (!Number.isFinite(nrpool) || nrpool <= 0) {
      toast.error('NrPool inválido');
      router.replace('/admin/ventas-especiales');
      return;
    }
    let cancelled = false;
    setLoading(true);
    getVentaEspecialEdicion(nrpool)
      .then((data) => {
        if (cancelled) return;
        setDetalle(data);
        const mapped = mapDetalleToForm(data);
        setVigencia(mapped.vigencia);
        setItems(mapped.items);
        setNuevos([]);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('No se pudo cargar la oferta');
          setDetalle(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nrpool, router]);

  const guardar = async () => {
    const activos = items.filter((i) => !i.eliminar);
    if (activos.length + nuevos.length === 0) {
      toast.error('La oferta debe tener al menos un producto');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        descripcion: vigencia.descripcion,
        observaciones: vigencia.observaciones,
        estado: vigencia.estado,
        disdes: vigencia.disdes || null,
        dishas: vigencia.dishas || null,
        pathBanner: vigencia.pathBanner?.trim() || null,
        productos: items.map((row) => ({
          orden: row.orden,
          cantidadTotal: row.cantidadTotal,
          cantidadConsumida: row.cantidadConsumida,
          porcentajeDescuento: row.porcentajeDescuento,
          eliminar: row.eliminar === true,
        })),
        productosNuevos: nuevos.map((p) => ({
          tippro: p.tippro,
          artcod: p.artcod,
          stockOferta: p.stockOferta,
          dtoPct: p.dtoPct,
          precioOferta: p.precioOferta,
          precioLista: p.precioLista,
          precioCosto: p.costo,
        })),
      };

      const updated = await updateVentaEspecialEdicion(nrpool, payload);
      setDetalle(updated);
      const mapped = mapDetalleToForm(updated);
      setVigencia(mapped.vigencia);
      setItems(mapped.items);
      setNuevos([]);
      toast.success('Cambios guardados');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm font-bold text-gray-500">Cargando…</div>;
  }

  if (!detalle) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/ventas-especiales"
            prefetch
            className="text-[11px] font-black uppercase tracking-widest text-[#0e8c85] hover:underline"
          >
            ← Volver al listado
          </Link>
          <span className="text-xs font-black text-gray-400">
            NrPool: <span className="text-[#001f3f]">{nrpool}</span>
          </span>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          No se pudo cargar la venta especial.
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-[11px] font-black uppercase tracking-widest bg-[#001f3f] text-white px-4 py-2 rounded-xl hover:brightness-110 border-2 border-[#001f3f]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/ventas-especiales"
            prefetch
            className="text-[11px] font-black uppercase tracking-widest text-[#0e8c85] hover:underline"
          >
            ← Volver al listado
          </Link>
          <span className="text-xs font-black text-gray-400">
            NrPool: <span className="text-[#001f3f]">{nrpool}</span>
            {detalle.poolthCodigo ? (
              <>
                {' '}
                · Tipo: <span className="text-[#001f3f]">{detalle.poolthCodigo}</span>
              </>
            ) : null}
          </span>
        </div>
      </div>

      {statsLoading ? (
        <p className="rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center text-sm font-bold text-gray-500">
          Cargando estadísticas…
        </p>
      ) : statsError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          {statsError}
        </p>
      ) : stats ? (
        <OfertaEstadisticasPanel stats={stats} />
      ) : null}

      <VentaEspecialEditProductosTable
        items={items}
        nuevos={nuevos}
        onChangeItems={setItems}
        onChangeNuevos={setNuevos}
      />

      <VentaEspecialEditVigenciaFields
        value={vigencia}
        onChange={setVigencia}
        tipfin={detalle.tipfin}
        bannerImageUrl={detalle.bannerImageUrl}
      />

      <VentaEspecialEditContextoReadonly
        segmentacion={detalle.segmentacion}
        condicionesPago={detalle.condicionesPago ?? []}
      />

      <div className="flex justify-end gap-2 sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Link
          href="/admin/ventas-especiales"
          prefetch
          className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 border-black text-black bg-white hover:bg-gray-100"
        >
          Cancelar
        </Link>
        <button
          type="button"
          disabled={saving}
          onClick={guardar}
          className="text-[11px] font-black uppercase tracking-widest bg-[#0e8c85] text-white px-5 py-2 rounded-xl hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

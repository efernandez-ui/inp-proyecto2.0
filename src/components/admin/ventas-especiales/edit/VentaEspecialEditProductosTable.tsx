'use client';

import { useMemo, useState } from 'react';
import { FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import type { ProductoDTO } from '@/interfaces/producto';
import Modal from '@/components/modals/Modal';
import { ProductosExcelImportModal } from '../nueva-estrategia/components/ProductosExcelImportModal';
import { ProductosSeleccionModal } from '../nueva-estrategia/components/ProductosSeleccionModal';
import {
  computeMetrics,
  mapProductoToItem,
  type OfertaProductoSeleccionado,
} from '../nueva-estrategia/utils/productoOfertaMetrics';
import type { VentaEspecialEdicionItem } from '@/services/admin';

export type EdicionProductoRow = VentaEspecialEdicionItem & {
  eliminar?: boolean;
};

type Props = {
  items: EdicionProductoRow[];
  nuevos: OfertaProductoSeleccionado[];
  onChangeItems: (next: EdicionProductoRow[]) => void;
  onChangeNuevos: (next: OfertaProductoSeleccionado[]) => void;
};

const panelClass = 'rounded-2xl border border-gray-200 bg-white shadow-sm';
const numberCellClass = 'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-slate-800 outline-none focus:border-[#0e8c85] focus:ring-1 focus:ring-[#0e8c85]/30';

function money(value: number): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value || 0);
}

function asNum(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function computeDisponiblePreview(row: EdicionProductoRow): number {
  // Misma fórmula que OfertaStockUtils en backend: CNTTOT − RES − CON
  return Math.max(0, asNum(row.cantidadTotal) - asNum(row.cantidadReservada) - asNum(row.cantidadConsumida));
}

export function VentaEspecialEditProductosTable({
  items,
  nuevos,
  onChangeItems,
  onChangeNuevos,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [defaultDtoPct, setDefaultDtoPct] = useState(20);
  const [confirmDelete, setConfirmDelete] = useState<EdicionProductoRow | null>(null);

  const visibleItems = useMemo(() => items.filter((i) => !i.eliminar), [items]);
  const existingKeys = useMemo(() => {
    const set = new Set<string>();
    visibleItems.forEach((i) => set.add(`${i.tippro}-${i.artcod}`));
    nuevos.forEach((i) => set.add(i.key));
    return set;
  }, [visibleItems, nuevos]);

  const addProduct = (product: ProductoDTO): boolean => {
    const mapped = mapProductoToItem(product, defaultDtoPct);
    if (existingKeys.has(mapped.key)) return false;
    onChangeNuevos([...nuevos, mapped]);
    return true;
  };

  const addProducts = (products: ProductoDTO[]): number => {
    const keys = new Set(existingKeys);
    const added: OfertaProductoSeleccionado[] = [];
    products.forEach((product) => {
      const mapped = mapProductoToItem(product, defaultDtoPct);
      if (!keys.has(mapped.key)) {
        keys.add(mapped.key);
        added.push(mapped);
      }
    });
    if (added.length > 0) onChangeNuevos([...nuevos, ...added]);
    return added.length;
  };

  const handleImport = (imported: OfertaProductoSeleccionado[]) => {
    const keys = new Set(existingKeys);
    const toAdd = imported.filter((i) => {
      if (keys.has(i.key)) return false;
      keys.add(i.key);
      return true;
    });
    if (toAdd.length > 0) onChangeNuevos([...nuevos, ...toAdd]);
  };

  const updateItem = (orden: number, patch: Partial<EdicionProductoRow>) => {
    onChangeItems(items.map((row) => (row.orden === orden ? { ...row, ...patch } : row)));
  };

  const updateNuevo = (key: string, patch: Partial<OfertaProductoSeleccionado>) => {
    onChangeNuevos(
      nuevos.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        if (patch.dtoPct != null) {
          const metrics = computeMetrics({
            precioLista: next.precioLista,
            costo: next.costo,
            dtoPct: next.dtoPct,
          });
          return { ...next, ...metrics };
        }
        return next;
      })
    );
  };

  const requestDeleteExisting = (row: EdicionProductoRow) => {
    if (asNum(row.cantidadReservada) > 0) return;
    setConfirmDelete(row);
  };

  const confirmRemoval = () => {
    if (!confirmDelete) return;
    updateItem(confirmDelete.orden, { eliminar: true });
    setConfirmDelete(null);
  };

  const removeNuevo = (key: string) => {
    onChangeNuevos(nuevos.filter((n) => n.key !== key));
  };

  const totalRows = visibleItems.length + nuevos.length;

  return (
    <section className="space-y-4">
      <div className={`${panelClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#001f3f]">Productos de la oferta</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Modificá stock, vendidos (impacto), descuento o agregá más ítems.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Dto default
            <input
              type="number"
              min={0}
              max={100}
              className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-sm font-bold text-slate-800"
              value={defaultDtoPct}
              onChange={(e) => setDefaultDtoPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            />
            %
          </label>
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#0e8c85]/30 bg-[#ebf8f4] px-4 text-[11px] font-bold uppercase tracking-wider text-[#0e8c85] hover:bg-[#d4f3ec]"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Importar Excel
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#0e8c85] bg-[#0e8c85] px-4 text-[11px] font-bold uppercase tracking-wider text-white hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Agregar productos
          </button>
        </div>
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        <div className="bg-slate-800 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          Ítems ({totalRows})
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-right">Stock oferta</th>
                <th className="px-3 py-2 text-right">Reservado</th>
                <th className="px-3 py-2 text-right">Vendidos</th>
                <th className="px-3 py-2 text-right">Disponible</th>
                <th className="px-3 py-2 text-right">Dto %</th>
                <th className="px-3 py-2 text-right">Precio oferta</th>
                <th className="px-3 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((row) => (
                <tr key={`ex-${row.orden}`} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-slate-800">
                      {row.tippro}
                      {row.artcod}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">{row.descripcion || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min={asNum(row.cantidadReservada) + asNum(row.cantidadConsumida)}
                      className={numberCellClass}
                      value={asNum(row.cantidadTotal)}
                      onChange={(e) => updateItem(row.orden, { cantidadTotal: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-500">
                    {asNum(row.cantidadReservada)}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min={0}
                      className={numberCellClass}
                      title="Cantidad consumida / impacto visual"
                      value={asNum(row.cantidadConsumida)}
                      onChange={(e) =>
                        updateItem(row.orden, { cantidadConsumida: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold text-[#0e8c85]">
                    {computeDisponiblePreview(row)}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={numberCellClass}
                      value={asNum(row.porcentajeDescuento)}
                      onChange={(e) =>
                        updateItem(row.orden, { porcentajeDescuento: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-700">
                    ${money(asNum(row.precioOferta))}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      disabled={asNum(row.cantidadReservada) > 0}
                      title={
                        asNum(row.cantidadReservada) > 0
                          ? 'No se puede eliminar: tiene reservas'
                          : 'Eliminar producto'
                      }
                      onClick={() => requestDeleteExisting(row)}
                      className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {nuevos.map((row) => (
                <tr key={`new-${row.key}`} className="border-b border-emerald-50 bg-emerald-50/30 hover:bg-emerald-50/50">
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-slate-800">
                      {row.tippro}
                      {row.artcod}
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-700">
                        Nuevo
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">{row.descripcion || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min={0}
                      className={numberCellClass}
                      value={row.stockOferta}
                      onChange={(e) =>
                        updateNuevo(row.key, { stockOferta: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-400">0</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-400">0</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold text-[#0e8c85]">{row.stockOferta}</td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={numberCellClass}
                      value={row.dtoPct}
                      onChange={(e) =>
                        updateNuevo(row.key, { dtoPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-700">
                    ${money(row.precioOferta)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeNuevo(row.key)}
                      className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {totalRows === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm font-medium text-slate-400">
                    No hay productos en esta oferta. Agregá al menos uno para guardar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <ProductosSeleccionModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedKeys={[...existingKeys]}
        defaultDtoPct={defaultDtoPct}
        onChangeDefaultDtoPct={setDefaultDtoPct}
        onAddProduct={addProduct}
        onAddProducts={addProducts}
      />

      <ProductosExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onConfirm={handleImport}
      />

      <Modal
        isOpen={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
        contentClassName="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-800">Eliminar producto</h3>
          <p className="mt-2 text-sm text-slate-600">
            ¿Eliminar {confirmDelete?.tippro}
            {confirmDelete?.artcod} de la oferta?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmRemoval}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

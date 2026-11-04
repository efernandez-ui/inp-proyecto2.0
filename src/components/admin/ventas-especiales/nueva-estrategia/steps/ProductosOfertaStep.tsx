'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, PackageSearch, Plus, Trash2 } from 'lucide-react';
import type { ProductoDTO } from '@/interfaces/producto';
import Modal from '@/components/modals/Modal';
import { ProductosExcelImportModal } from '../components/ProductosExcelImportModal';
import { ProductosSeleccionModal } from '../components/ProductosSeleccionModal';
import { StockSucursalesTags } from '../components/StockSucursalesTags';
import {
  computeMetrics,
  mapProductoToItem,
  mergeProductos,
  type OfertaProductoSeleccionado,
} from '../utils/productoOfertaMetrics';

export type { OfertaProductoSeleccionado };

type Props = {
  selectedItems: OfertaProductoSeleccionado[];
  onChangeSelectedItems: (next: OfertaProductoSeleccionado[]) => void;
};

const panelClass = 'rounded-2xl border border-gray-200 bg-white shadow-sm';
const rowClass = 'border-b border-slate-100 transition-colors hover:bg-slate-50/50 last:border-0';
const numberCellClass = 'px-3 py-2.5 text-right tabular-nums';

function money(value: number): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value || 0);
}

export function ProductosOfertaStep({ selectedItems, onChangeSelectedItems }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [defaultDtoPct, setDefaultDtoPct] = useState(20);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    keysToDelete: string[];
  } | null>(null);

  const selectedMap = useMemo(() => {
    const set = new Set<string>();
    selectedItems.forEach((item) => set.add(item.key));
    return set;
  }, [selectedItems]);

  const addProduct = (product: ProductoDTO): boolean => {
    const mapped = mapProductoToItem(product, defaultDtoPct);
    if (selectedMap.has(mapped.key)) return false;
    onChangeSelectedItems([...selectedItems, mapped]);
    return true;
  };

  const addProducts = (products: ProductoDTO[]): number => {
    const existingKeys = new Set(selectedItems.map((item) => item.key));
    const mappedNewItems: OfertaProductoSeleccionado[] = [];
    products.forEach((product) => {
      const mapped = mapProductoToItem(product, defaultDtoPct);
      if (!existingKeys.has(mapped.key)) {
        existingKeys.add(mapped.key);
        mappedNewItems.push(mapped);
      }
    });
    if (mappedNewItems.length > 0) {
      onChangeSelectedItems([...selectedItems, ...mappedNewItems]);
    }
    return mappedNewItems.length;
  };

  const handleImportProductos = (imported: OfertaProductoSeleccionado[]) => {
    onChangeSelectedItems(mergeProductos(selectedItems, imported));
  };

  const updateItemDto = (key: string, dtoPct: number) => {
    onChangeSelectedItems(
      selectedItems.map((item) => {
        if (item.key !== key) return item;
        const safeDto = Number.isFinite(dtoPct) ? dtoPct : item.dtoPct;
        const metrics = computeMetrics({
          precioLista: item.precioLista,
          costo: item.costo,
          dtoPct: safeDto,
        });
        return { ...item, dtoPct: safeDto, ...metrics };
      })
    );
  };

  const requestRemoveItem = (key: string) => {
    const target = selectedItems.find((item) => item.key === key);
    const label = target ? `${target.tippro}${target.artcod}` : 'este producto';
    setConfirmDialog({
      title: 'Eliminar producto',
      description: `¿Querés eliminar ${label} de la oferta?`,
      keysToDelete: [key],
    });
  };

  const updateItemStockOferta = (key: string, nextStock: number) => {
    const sanitized = Math.max(0, Math.trunc(Number.isFinite(nextStock) ? nextStock : 0));
    onChangeSelectedItems(
      selectedItems.map((item) => (item.key === key ? { ...item, stockOferta: sanitized } : item))
    );
  };

  const checkedExistingKeys = checkedKeys.filter((key) => selectedMap.has(key));
  const allSelected = selectedItems.length > 0 && checkedExistingKeys.length === selectedItems.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setCheckedKeys([]);
      return;
    }
    setCheckedKeys(selectedItems.map((item) => item.key));
  };

  const toggleRowSelection = (key: string) => {
    setCheckedKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return [...prev, key];
    });
  };

  const requestRemoveSelectedItems = () => {
    if (checkedExistingKeys.length === 0) return;
    setConfirmDialog({
      title: 'Eliminar productos seleccionados',
      description: `¿Querés eliminar ${checkedExistingKeys.length} producto(s) seleccionados de la oferta?`,
      keysToDelete: checkedExistingKeys,
    });
  };

  const confirmRemoval = () => {
    if (!confirmDialog) return;
    const keys = new Set(confirmDialog.keysToDelete);
    onChangeSelectedItems(selectedItems.filter((item) => !keys.has(item.key)));
    setCheckedKeys((prev) => prev.filter((key) => !keys.has(key)));
    setConfirmDialog(null);
  };

  return (
    <div className="mt-2">
      <section className="space-y-4">
        <div className={`${panelClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#001f3f]">Productos de la oferta</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Agregá productos manualmente, importá un Excel o ajustá descuento/stock ofertado.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex items-center justify-between gap-3 bg-slate-800 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              Productos cargados ({selectedItems.length})
            </div>
            <button
              type="button"
              onClick={requestRemoveSelectedItems}
              disabled={checkedExistingKeys.length === 0}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar seleccionados
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-10" />
                <col />
                <col className="w-[64px]" />
                <col className="w-[100px]" />
                <col className="w-[80px]" />
                <col className="w-[72px]" />
                <col className="w-[100px]" />
                <col className="w-[80px]" />
                <col className="w-[72px]" />
                <col className="w-[56px]" />
              </colgroup>
              <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <span className="block">Producto</span>
                    <span className="mt-0.5 block text-[9px] font-medium normal-case tracking-normal text-slate-400">
                      Stock disp. por sucursal
                    </span>
                  </th>
                  <th className="px-3 py-2 text-right">Stock oferta</th>
                  <th className="px-3 py-2 text-right">P. lista</th>
                  <th className="px-3 py-2 text-right">Costo</th>
                  <th className="px-3 py-2 text-right">DTO%</th>
                  <th className="px-3 py-2 text-right">P. oferta</th>
                  <th className="px-3 py-2 text-right">CM$</th>
                  <th className="px-3 py-2 text-right">CM%</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                      <div className="mx-auto flex max-w-sm items-center justify-center gap-2 font-medium">
                        <PackageSearch className="h-4 w-4 text-slate-400" />
                        Todavía no cargaste productos a la oferta.
                      </div>
                    </td>
                  </tr>
                ) : (
                  selectedItems.map((item) => {
                    return (
                      <tr key={item.key} className={rowClass}>
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={checkedExistingKeys.includes(item.key)}
                            onChange={() => toggleRowSelection(item.key)}
                            aria-label={`Seleccionar ${item.tippro}${item.artcod}`}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold uppercase leading-snug text-[#001f3f]" title={item.descripcion}>
                            {item.descripcion}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.tippro}{item.artcod}</p>
                          <StockSucursalesTags
                            noa={item.stockNoa}
                            nea={item.stockNea}
                            bue={item.stockBue}
                            cuy={item.stockCuy}
                            className="mt-2"
                          />
                        </td>
                        <td className={numberCellClass}>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={item.stockOferta}
                            onChange={(e) => updateItemStockOferta(item.key, Number(e.target.value))}
                            className="ml-auto h-7 w-14 rounded-md border border-slate-200 px-1.5 text-right text-xs font-semibold tabular-nums text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-[#0e8c85]"
                          />
                        </td>
                        <td className={`${numberCellClass} min-w-[110px] font-bold text-slate-700`}>
                          ${money(item.precioLista)}
                        </td>
                        <td className={`${numberCellClass} text-slate-500`}>
                          {item.costo == null ? 'N/D' : `$${money(item.costo)}`}
                        </td>
                        <td className={numberCellClass}>
                          <input
                            type="number"
                            value={item.dtoPct}
                            onChange={(e) => updateItemDto(item.key, Number(e.target.value))}
                            className="h-8 w-20 rounded-md border border-transparent px-2 text-right text-xs font-semibold tabular-nums text-[#003f9e] outline-none transition-colors hover:border-slate-300 focus:border-[#0e8c85]"
                          />
                        </td>
                        <td className={numberCellClass}>
                          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
                            ${money(item.precioOferta)}
                          </span>
                        </td>
                        <td className={`${numberCellClass} font-semibold text-slate-700`}>
                          {item.cms == null ? 'N/D' : `$${money(item.cms)}`}
                        </td>
                        <td className={`${numberCellClass} font-bold ${item.cmPct == null ? 'text-slate-500' : item.cmPct >= 0 ? 'text-[#0f9d6a]' : 'text-[#c62828]'}`}>
                          {item.cmPct == null ? 'N/D' : `${item.cmPct.toFixed(1)}%`}
                        </td>
                        <td className={numberCellClass}>
                          <button
                            type="button"
                            onClick={() => requestRemoveItem(item.key)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            title="Quitar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ProductosExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onConfirm={handleImportProductos}
      />

      <ProductosSeleccionModal
        open={pickerOpen}
        selectedKeys={selectedItems.map((item) => item.key)}
        defaultDtoPct={defaultDtoPct}
        onChangeDefaultDtoPct={setDefaultDtoPct}
        onClose={() => setPickerOpen(false)}
        onAddProduct={addProduct}
        onAddProducts={addProducts}
      />

      <Modal isOpen={confirmDialog != null} onClose={() => setConfirmDialog(null)} contentClassName="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#001f3f]">
                {confirmDialog?.title ?? 'Confirmar acción'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{confirmDialog?.description}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDialog(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmRemoval}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-100"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

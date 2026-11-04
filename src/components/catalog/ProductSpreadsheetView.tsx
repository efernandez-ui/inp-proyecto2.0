'use client'

import { Table2 } from 'lucide-react'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ProductUI } from '@/models/ProductUI'
import { RootState } from '@/store'
import { useCatalogUI } from '@/context/CatalogUIContext'
import ProductSpreadsheetRow from './ProductSpreadsheetRow'

type Props = {
  products: ProductUI[]
  startIndex: number
}

type ColDef = { id: string; label: string; weight: number; align?: 'left' | 'center' }

/** Pesos relativos: la tabla ocupa el 100% del contenedor (sin min-width ni scroll horizontal). */
function buildColumns(showPurchasePrice: boolean, showPublicPrice: boolean, showBonif2: boolean): ColDef[] {
  const cols: ColDef[] = [
    { id: 'row', label: '#', weight: 2.5, align: 'center' },
    { id: 'code', label: 'Cod.', weight: 7 },
    { id: 'product', label: 'Producto', weight: 22 },
    { id: 'presentations', label: 'Presentaciones', weight: 9 },
    { id: 'noa', label: 'NOA', weight: 3.5, align: 'center' },
    { id: 'nea', label: 'NEA', weight: 3.5, align: 'center' },
    { id: 'bue', label: 'BUE', weight: 3.5, align: 'center' },
    { id: 'cuy', label: 'CUY', weight: 3.5, align: 'center' },
  ]
  if (showPurchasePrice) {
    cols.push({ id: 'finalPrice', label: 'Precio final', weight: 9 })
  }
  if (showPublicPrice) {
    cols.push({ id: 'publicPrice', label: 'Público', weight: 7 })
  }
  cols.push({ id: 'sustituto', label: 'Sust.', weight: 4, align: 'center' })
  cols.push({ id: 'quantity', label: 'Cant.', weight: 5, align: 'center' })
  if (showBonif2) {
    cols.push({ id: 'bonif2', label: 'Bonif.%', weight: 5, align: 'center' })
  }
  cols.push({ id: 'action', label: 'Acción', weight: 8 })
  cols.push({ id: 'subtotal', label: 'Subtotal', weight: 7.5 })

  // Producto absorbe el peso de columnas ocultas para no dejar huecos
  const hiddenBonus =
    (showPurchasePrice ? 0 : 9) + (showPublicPrice ? 0 : 7) + (showBonif2 ? 0 : 5)
  const product = cols.find((c) => c.id === 'product')
  if (product && hiddenBonus > 0) {
    product.weight += hiddenBonus
  }
  return cols
}

export default function ProductSpreadsheetView({ products, startIndex }: Props) {
  const { showPurchasePrice, showPublicPrice } = useCatalogUI()
  const user = useSelector((state: RootState) => state.auth.user)
  const showBonif2 = ['V', 'A', 'S', 'B'].includes(user?.tipo || '')

  const columns = useMemo(
    () => buildColumns(showPurchasePrice, showPublicPrice, showBonif2),
    [showPurchasePrice, showPublicPrice, showBonif2],
  )
  const totalWeight = useMemo(
    () => columns.reduce((sum, c) => sum + c.weight, 0),
    [columns],
  )

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[4px] border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gray-200 bg-[#f3f6fb] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Table2 className="h-4 w-4 shrink-0 text-[#0e8c85]" />
          <span className="truncate text-[10px] font-black uppercase tracking-tighter text-[#001f3f]">
            Vista de lista tipo Excel
          </span>
        </div>
      </div>
      <div className="w-full min-w-0">
        <table
          className="w-full table-fixed border-collapse text-[10px] font-normal [&_*]:!text-[10px] [&_*]:!font-normal [&_span.product-brand]:!font-bold [&_span.product-title]:!font-bold [&_.discount-badge]:!font-black [&_.discount-badge]:!text-[8px] [&_.final-price]:!font-bold [&_.final-price]:!text-[11px] [&_td[data-price]]:!font-bold [&_td[data-subtotal]]:!font-bold [&_th]:!font-bold [&_th]:overflow-hidden [&_th]:text-ellipsis"
        >
          <colgroup>
            {columns.map((col) => (
              <col key={col.id} style={{ width: `${(col.weight / totalWeight) * 100}%` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#e9eef7] text-[10px] uppercase text-slate-600">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`border border-gray-300 px-1 py-2 whitespace-nowrap ${
                    col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  title={col.label}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border border-gray-200 px-4 py-8 text-center text-[11px] font-black uppercase text-slate-500"
                >
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <ProductSpreadsheetRow
                  key={`${product.tippro}-${product.artcod}-${index}`}
                  product={product}
                  rowNumber={startIndex + index + 1}
                  rowIndex={index}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

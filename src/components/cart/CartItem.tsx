'use client'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Trash2, Plus, Minus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { CartItem as ICartItem } from '../../interfaces/cart'
import { removeItemFromBackend, updateItemBackend } from '../../store/cartSlice'
import { RootState, AppDispatch } from '../../store'
import { toast } from 'react-toastify'
import { resolveOfertaPrecios } from '@/utils/ofertaPrecios'
import { resolveOfertaCountdownContext } from '@/utils/ofertaCountdown'
import OfertaCountdownBanner from '@/components/catalog/OfertaCountdownBanner'
import { useCartQuantitySync } from '@/hooks/useCartQuantitySync'
import { cmPercentToneClass, formatCmPercent } from '@/utils/cartContribucionMarginal'
import { isStaff } from '@/utils/auth'
import { isValidProductImageUrl } from '@/utils/productImage'

interface CartItemProps {
  item: ICartItem
  isVendedor: boolean
  cartId: number
  readOnly?: boolean
}

export default function CartItem({ item, isVendedor, cartId, readOnly = false }: CartItemProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { user, selectedClient } = useSelector((state: RootState) => state.auth)

  const [localBonus2, setLocalBonus2] = React.useState(Math.abs(item.bonificacion2 || 0).toString())

  const { localQuantity, increment, decrement } = useCartQuantitySync({
    cartId,
    itemId: item.itemId,
    serverQuantity: item.quantity,
  })

  React.useEffect(() => {
    setLocalBonus2(Math.abs(item.bonificacion2 || 0).toString())
  }, [item.bonificacion2])

  const handleBonusBlur = async () => {
    if (readOnly) return
    let val = parseFloat(localBonus2)
    if (isNaN(val)) {
      setLocalBonus2(Math.abs(item.bonificacion2 || 0).toString())
      return
    }

    val = Math.max(0, Math.round(Math.abs(val) * 100) / 100)
    setLocalBonus2(String(val))

    // Convertir a negativo para el backend (descuento)
    const backendVal = val === 0 ? 0 : -val

    if (backendVal === (item.bonificacion2 || 0)) return

    const token = localStorage.getItem('authToken')
    if (token && item.itemId) {
      try {
        await dispatch(updateItemBackend({ cartId, itemId: item.itemId, updates: { bonificacion2: backendVal }, token })).unwrap()
      } catch (error: any) {
        const errorMsg = error?.message || 'Error al actualizar bonificación';
        toast.error(errorMsg);
        setLocalBonus2(Math.abs(item.bonificacion2 || 0).toString());
      }
    }
  }

  const handleIncrement = () => {
    if (readOnly || !item.itemId) return
    increment()
  }

  const handleDecrement = () => {
    if (readOnly || !item.itemId || localQuantity <= 1) return
    decrement()
  }

  const handleRemove = async () => {
    if (readOnly || !item.itemId) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (window.confirm('¿Está seguro que desea eliminar este producto?')) {
      try {
        await dispatch(removeItemFromBackend({ cartId, itemId: item.itemId, token })).unwrap();
        toast.success('Producto eliminado');
      } catch (error) {
        toast.error('Error al eliminar producto');
      }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(price)
  }
  const rawImageUrl = item.images && item.images.length > 0
    ? (typeof item.images[0] === 'string' ? item.images[0] : (item.images[0] as any).pathImagenGrande)
    : ''
  const imageUrl = isValidProductImageUrl(rawImageUrl) ? rawImageUrl : '/images/placeholder-generic.svg'

  const nroctaParam = isStaff(user) && selectedClient?.nrocta ? `?nrocta=${selectedClient.nrocta}` : '';
  const productUrl = `/producto/${(item.tippro || '').trim()}${(item.artcod || '').trim()}${nroctaParam}`

  const bonif1Abs = Math.abs(Number(item.bonificacion1 ?? 0))
  const bonif1Raw = Number(item.bonificacion1 ?? 0)
  const precioLista = item.precioSinOferta ?? item.precioUnitario ?? 0
  const precioMostrarBonif = precioLista * (1 + bonif1Raw / 100)

  const ofertaPrecios = resolveOfertaPrecios({
    enOferta: item.enOferta,
    itemProductoVentaEspeciales: item.itemProductoVentaEspeciales,
    precioMostrar: precioMostrarBonif,
    precioListaMostrar: precioLista,
    bonificacion1: bonif1Abs,
    bonificacion2: item.bonificacion2,
    quantity: item.quantity,
  })

  const nroPoolOferta =
    (item.nroVentaEspecial && item.nroVentaEspecial > 0
      ? item.nroVentaEspecial
      : item.itemProductoVentaEspeciales?.[0]?.nroPool) ?? 0

  const ofertaCountdown = resolveOfertaCountdownContext({
    enOferta: item.enOferta,
    itemProductoVentaEspeciales: item.itemProductoVentaEspeciales,
    ofertaPrecios,
  })

  const showPrecioPromocional = ofertaPrecios.activa || ofertaPrecios.modoDescuento === 'oferta' || ofertaPrecios.modoDescuento === 'bonificacion'
  const precioUnitFinal = item.precioFinalPeso && item.precioFinalPeso > 0
    ? item.precioFinalPeso
    : (item.totalLinea && item.quantity ? item.totalLinea / item.quantity : ofertaPrecios.precioOfertaUnitario)

  const renderUnitPrice = () => {
    if (showPrecioPromocional) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] line-through text-gray-400 font-semibold">
            ${ofertaPrecios.precioOriginalUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[13px] xl:text-[14px] font-black text-[#0056b3]">
            ${precioUnitFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
          {ofertaPrecios.modoDescuento === 'oferta' && (
            <span className="text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
              OFERTA {ofertaPrecios.porcentajeOferta}%
            </span>
          )}
          {ofertaPrecios.modoDescuento === 'bonificacion' && bonif1Abs > 0 && (
            <span className="text-[9px] font-black bg-[#e7000b] text-white px-1.5 py-0.5 rounded-full">
              BONIF {bonif1Abs}{ofertaPrecios.porcentajeBonificacion2 > 0 ? `+${ofertaPrecios.porcentajeBonificacion2}` : ''}%
            </span>
          )}
        </div>
      )
    }
    return (
      <div className="text-[13px] xl:text-[14px] font-black text-black">
        ${item.precioFinalPeso?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '---'}
      </div>
    )
  }

  const renderLineTotal = () => {
    if (showPrecioPromocional) {
      return (
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[12px] line-through text-gray-400 font-semibold">
            ${ofertaPrecios.precioOriginal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[16px] xl:text-[18px] font-black text-[#001f3f]">
            ${(item.totalLinea ?? ofertaPrecios.precioOferta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )
    }
    return (
      <div className="text-[16px] xl:text-[18px] font-black text-[#001f3f]">
        ${item.totalLinea?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '---'}
      </div>
    )
  }

  // Dentro de CartItem.tsx
  return (
    <div className="bg-white border-b border-gray-100 hover:bg-gray-50/80 transition-all group p-4 md:p-1 lg:p-2 xl:p-3">
      {/* Vista Desktop (md+) */}
      <div className="hidden md:grid grid-cols-12 gap-1 lg:gap-2 xl:gap-4 items-center py-5">
        {/* Info Producto */}
        <div className={`${isVendedor ? 'col-span-3' : 'col-span-5'} flex items-center gap-4 pl-4`}>
          <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0 shadow-sm">
            <img src={imageUrl} alt="" className="w-10 h-10 object-contain" />
          </div>
          <div className="min-w-0 flex-grow">
            <p className="text-[11px] font-bold text-gray-400 uppercase leading-none mb-1.5 tracking-wider">{item.marca}</p>
            <Link href={productUrl} className="group/link block">
              <p className="text-[13px] font-bold text-[#001f3f] leading-tight mb-1 line-clamp-2 uppercase group-hover/link:text-blue-600 transition-colors flex items-center gap-1">
                {item.descripcion}
                <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </p>
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {item.enOferta === 'S' && ofertaPrecios.porcentajeOferta > 0 && (
                <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase tracking-tighter">
                  Oferta -{ofertaPrecios.porcentajeOferta}%
                </span>
              )}
              {item.enOferta === 'S' && nroPoolOferta > 0 && (
                <span className="text-[10px] font-semibold text-gray-500">
                  Pool #{nroPoolOferta}
                </span>
              )}
              <span className="text-[11px] font-medium text-gray-400">{item.tippro.trim()}{item.artcod.trim()}</span>
            </div>
            {item.advertenciaStockOferta && (
              <p className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                {item.advertenciaStockOferta}
              </p>
            )}
            {ofertaCountdown.shouldShow && ofertaCountdown.pool && (
              <OfertaCountdownBanner pool={ofertaCountdown.pool} variant="cart" />
            )}
          </div>
        </div>

        <div className="col-span-1 text-center border-l border-gray-100 px-0.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1.5 tracking-tighter">Peso T.</p>
          <div className="text-[12px] xl:text-[13px] font-bold text-black text-nowrap">
            {((item.peso || 0) * localQuantity).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </div>
        </div>

        {/* % Bonif 1 */}
        {isVendedor && <div className="col-span-1 text-center border-l border-gray-100 px-0.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1.5 tracking-tighter">% Bonif 1</p>
          <div className="text-[13px] xl:text-[14px] font-black text-blue-600">
            {Math.abs(Number(item.bonificacion1 ?? 0))}%
          </div>
        </div>}

        {/* Cantidad */}
        <div className="col-span-1 flex flex-col items-center justify-center border-l border-gray-100 px-0.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1.5 tracking-tighter">Cant</p>
          <div className={`flex items-center gap-1 xl:gap-2 bg-gray-50 rounded-lg p-0.5 xl:p-1 border border-gray-200 ${readOnly ? 'opacity-60' : ''}`}>
            <button type="button" disabled={readOnly} onClick={handleDecrement} className="w-5 h-5 xl:w-6 xl:h-6 flex items-center justify-center rounded bg-white text-black hover:bg-gray-100 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"><Minus size={10} xl-size={12} strokeWidth={2.5} /></button>
            <span className="text-[12px] xl:text-[13px] font-black text-black min-w-[16px] xl:min-w-[20px] text-center">{localQuantity}</span>
            <button type="button" disabled={readOnly} onClick={handleIncrement} className="w-5 h-5 xl:w-6 xl:h-6 flex items-center justify-center rounded bg-white text-black hover:bg-gray-100 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"><Plus size={10} xl-size={12} strokeWidth={2.5} /></button>
          </div>
        </div>

        {/* % Bonif 2 */}
        {isVendedor && <div className="col-span-1 text-center border-l border-gray-100 px-0.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1.5 tracking-tighter">% Bonif 2</p>
          <div className="flex items-center justify-center">
            <input
              type="number"
              min={0}
              step={0.01}
              value={localBonus2}
              onChange={(e) => setLocalBonus2(e.target.value)}
              onBlur={handleBonusBlur}
              disabled={!isVendedor || readOnly}
              className="w-10 xl:w-14 bg-white border border-gray-200 rounded-lg text-[12px] xl:text-[13px] font-bold py-0.5 xl:py-1 text-center focus:ring-2 focus:ring-[#001f3f] focus:border-[#001f3f] text-black transition-all outline-none disabled:opacity-50"
            />
          </div>
        </div>}

        {/* Unit. c/IVA */}
        <div className="col-span-2 text-center border-l border-gray-100 px-0.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1.5 tracking-tighter">Unit. c/Iva</p>
          {renderUnitPrice()}
        </div>

        {/* Total Item */}
        <div className="col-span-2 text-right border-l border-gray-100 pr-2 xl:pr-4 min-w-0">
          <p className="text-[10px] xl:text-[11px] font-black text-gray-400 uppercase leading-none mb-1.5 tracking-tighter">Total c/IVA</p>
          {renderLineTotal()}
        </div>

        {/* CM + Eliminar */}
        <div className="col-span-1 flex flex-col items-center justify-center gap-2 border-l border-gray-100 pr-2 min-w-[48px]">
          {isVendedor && (
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1 tracking-tighter">CM</p>
              <span
                className={`text-[11px] font-bold tabular-nums whitespace-nowrap ${cmPercentToneClass(item.contribucionMarginal)}`}
              >
                {formatCmPercent(item.contribucionMarginal)}
              </span>
            </div>
          )}
          {!readOnly && (
            <button type="button" onClick={handleRemove} className="text-gray-300 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-lg group shrink-0">
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Vista Mobile (xs to md) */}
      <div className="md:hidden flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-gray-50 rounded flex items-center justify-center border border-gray-100 shrink-0">
            <img src={imageUrl} alt="" className="w-10 h-10 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-gray-400 uppercase">{item.marca}</span>
              {!readOnly && (
                <button type="button" onClick={handleRemove} className="text-red-400 p-1"><Trash2 size={16} /></button>
              )}
            </div>
            <p className="text-[13px] text-[#001f3f] leading-tight mb-2">{item.descripcion}</p>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {item.enOferta === 'S' && ofertaPrecios.porcentajeOferta > 0 && (
                <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase tracking-tighter">
                  Oferta -{ofertaPrecios.porcentajeOferta}%
                </span>
              )}
              {item.enOferta === 'S' && nroPoolOferta > 0 && (
                <span className="text-[10px] font-semibold text-gray-500">
                  Pool #{nroPoolOferta}
                </span>
              )}
            </div>
            {item.advertenciaStockOferta && (
              <p className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                {item.advertenciaStockOferta}
              </p>
            )}
            {ofertaCountdown.shouldShow && ofertaCountdown.pool && (
              <OfertaCountdownBanner pool={ofertaCountdown.pool} variant="cart" />
            )}
            <p className="text-[11px] text-gray-400 uppercase">CÓD: {item.artcod}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[12px] text-black">
              <span className="text-gray-400 uppercase text-[10px]">Cantidad</span>
              <div className={`flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 ${readOnly ? 'opacity-60' : ''}`}>
                <button type="button" disabled={readOnly} onClick={handleDecrement} className="text-black disabled:opacity-40"><Minus size={12} strokeWidth={2} /></button>
                <span className="min-w-[16px] text-center">{localQuantity}</span>
                <button type="button" disabled={readOnly} onClick={handleIncrement} className="text-black disabled:opacity-40"><Plus size={12} strokeWidth={2} /></button>
              </div>
            </div>
            {isVendedor && (
              <div className="flex justify-between items-center text-[12px] text-black">
                <span className="text-gray-400 uppercase text-[10px]">Bonif. 1 (%)</span>
                <span className="font-bold text-blue-600">{Math.abs(Number(item.bonificacion1 ?? 0))}%</span>
              </div>
            )}
            {isVendedor && (
              <div className="flex justify-between items-center text-[12px] text-black">
                <span className="text-gray-400 uppercase text-[10px]">Bonif. 2 (%)</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={localBonus2}
                  onChange={(e) => setLocalBonus2(e.target.value)}
                  onBlur={handleBonusBlur}
                  disabled={readOnly}
                  className="w-14 bg-white border border-gray-200 rounded text-center py-1 outline-none disabled:opacity-50"
                />
              </div>
            )}
          </div>
          <div className="space-y-4 border-l border-gray-200 pl-4">
            <div className="flex flex-col items-end">
              <span className="text-gray-400 uppercase text-[10px]">Precio Unit. c/IVA</span>
              {showPrecioPromocional ? (
                <>
                  <span className="text-[11px] line-through text-gray-400">
                    ${ofertaPrecios.precioOriginalUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[13px] font-black text-[#0056b3]">
                    ${precioUnitFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </>
              ) : (
                <span className="text-[13px] text-black">${(item.precioFinalPeso && item.precioFinalPeso > 0 ? item.precioFinalPeso : item.totalLinea && item.quantity ? item.totalLinea / item.quantity : 0)?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              )}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-400 uppercase text-[10px] font-bold">Total Linea</span>
              {showPrecioPromocional ? (
                <>
                  <span className="text-[12px] line-through text-gray-400">
                    ${ofertaPrecios.precioOriginal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[15px] font-bold text-[#001f3f]">
                    ${(item.totalLinea ?? ofertaPrecios.precioOferta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </>
              ) : (
                <span className="text-[15px] font-bold text-[#001f3f]">${item.totalLinea?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              )}
            </div>
            {isVendedor && (
              <div className="flex justify-between items-center text-[12px] text-black border-t border-gray-200 pt-3 w-full">
                <span className="text-gray-400 uppercase text-[10px]">Cont. marg.</span>
                <span className={`font-bold tabular-nums ${cmPercentToneClass(item.contribucionMarginal)}`}>
                  {formatCmPercent(item.contribucionMarginal)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

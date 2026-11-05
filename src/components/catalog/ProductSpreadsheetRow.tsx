'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { Loader2, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { RootState, AppDispatch } from '@/store'
import { addItemToBackend, fetchActiveCart, removeItemFromBackend } from '@/store/cartSlice'
import { useSyncedCartQuantity } from '@/hooks/useSyncedCartQuantity'
import { useSyncedBonif2FromCart } from '@/hooks/useSyncedBonif2FromCart'
import { useCatalogUI } from '@/context/CatalogUIContext'
import { useCurrency } from '@/hooks/useCurrencyPreference'
import { ProductUI } from '@/models/ProductUI'
import ProductGalleryModal from './ProductGalleryModal'
import ProductosVinculadosModal from './ProductosVinculadosModal'
import { fetchSustitutos } from '@/services/products'
import type { ProductoDTO } from '@/interfaces/producto'
import { resolveOfertaPrecios } from '@/utils/ofertaPrecios'
import {
  computeCountdownProgress,
  formatDiasRestantesCorto,
  resolveOfertaCountdownContext,
} from '@/utils/ofertaCountdown'
import { poolStockProgress } from '@/utils/poolStockProgress'
import { resolvePreciosMoneda, calcularPrecioPublico, tienePrecioListaVisible } from '@/utils/productoPrecios'
import { branchStockFromList, resolveStockBatteryClass } from '@/utils/stockBattery'
import { stockDisplayForUser } from '@/utils/stockDisplay'
import { unidadPresentacionLabel, pesoPresentacionLabel } from '@/utils/productPresentacionLabels'
import { handleSpreadsheetArrowNav } from '@/utils/spreadsheetNav'
import { isStaff } from '@/utils/auth'
import { isValidProductImageUrl, PRODUCT_PLACEHOLDER_SMALL } from '@/utils/productImage'
import { CART_READONLY_CODE } from '@/services/cart'

const SPREADSHEET_INPUT_CLASS =
  'mx-auto box-border h-7 w-full max-w-full rounded-md border border-gray-200 bg-white px-0.5 text-center text-[11px] font-bold outline-none focus:border-[#0e8c85] disabled:cursor-not-allowed disabled:opacity-60'

type Props = {
  product: ProductUI
  rowNumber: number
  /** Índice 0-based dentro de la página actual (navegación con flechas). */
  rowIndex: number
}

function StockCell({
  label,
  stock,
  estado,
  userTipo,
  verStock,
}: {
  label: string
  stock: unknown
  estado?: string | null
  userTipo?: string | null
  verStock?: string | boolean | null
}) {
  const color = resolveStockBatteryClass(stock, estado)
  const display = stockDisplayForUser(userTipo, stock, estado, verStock)
  const text =
    display.mode === 'number'
      ? String(display.value)
      : display.mode === 'check'
        ? '✓'
        : '—'
  return (
    <td className="border border-gray-200 px-0.5 py-1.5 text-center font-black text-slate-700" title={`Stock ${label}`}>
      <span className="inline-flex max-w-full items-center justify-center gap-0.5">
        <span className={`relative mt-0.5 inline-block h-2.5 w-2 shrink-0 rounded-[2px] ${color}`}>
          <span className={`absolute -top-0.5 left-1/2 h-0.5 w-1 -translate-x-1/2 rounded-t-sm ${color}`} />
        </span>
        <span className="truncate">{text}</span>
      </span>
    </td>
  )
}

export default function ProductSpreadsheetRow({
  product,
  rowNumber,
  rowIndex,
}: Props) {
  const { isLoggedIn, selectedClient, user } = useSelector((state: RootState) => state.auth)
  const { activeCartId, items: cartItems } = useSelector((state: RootState) => state.cart)
  const dispatch = useDispatch<AppDispatch>()
  const { markupPercentage, showPurchasePrice, showPublicPrice } = useCatalogUI()
  const { currency } = useCurrency()
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [sustitutosOpen, setSustitutosOpen] = useState(false)
  const [sustitutos, setSustitutos] = useState<ProductoDTO[]>([])
  const [loadingSustitutos, setLoadingSustitutos] = useState(false)

  const cartItem = (cartItems || []).find((item) => {
    if (!item.tippro || !item.artcod || !product.tippro || !product.artcod) return false
    return (
      item.tippro.toString().trim().toUpperCase() === product.tippro.toString().trim().toUpperCase() &&
      item.artcod.toString().trim().toUpperCase() === product.artcod.toString().trim().toUpperCase()
    )
  })
  const isInCart = !!cartItem

  const productKey = `${(product.tippro || '').trim()}-${(product.artcod || '').trim()}`
  const { bonif2, setBonif2FromUi, isUpdatingBonif2 } = useSyncedBonif2FromCart({
    isInCart,
    cartBonificacion2: cartItem?.bonificacion2,
    cartItemId: cartItem?.itemId,
    activeCartId: activeCartId ?? undefined,
    catalogBonificacion2: product.bonificacion2,
    productKey,
  })
  /** String local para poder tipear "2." / "2.5" sin perder el decimal en el controlled number. */
  const [bonif2Text, setBonif2Text] = useState(() => String(bonif2))
  useEffect(() => {
    setBonif2Text(String(bonif2))
  }, [bonif2])
  const showBonif2 = ['V', 'A', 'S', 'B'].includes(user?.tipo || '')

  const { quantity, setQuantityFromUi, isUpdatingQty } = useSyncedCartQuantity({
    isInCart,
    cartItemId: cartItem?.itemId,
    cartQuantity: cartItem?.quantity,
    activeCartId: activeCartId ?? undefined,
  })

  const format = (val: number) =>
    new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)

  const precioReferenciaARS = product.precioReferencia || 0
  const precioFinalARS = product.precioFinalPeso || 0
  const bonificacion = product.bonificacion ? Math.abs(Number(product.bonificacion)) : 0

  const {
    simboloMoneda,
    tipoCambio,
    monedaAMostrar,
    precioMostrar,
    precioListaMostrar,
  } = resolvePreciosMoneda({
    monedaProducto: product.moneda,
    currency,
    precioFinalPeso: precioFinalARS,
    precioFinalDolar: product.precioFinalDolar,
    precioReferencia: precioReferenciaARS,
    cotizacionUSD: product.cotizacionUSD,
  })

  const ofertaPrecios = resolveOfertaPrecios({
    enOferta: product.enOferta,
    itemProductoVentaEspeciales: product.itemProductoVentaEspeciales,
    precioMostrar,
    precioListaMostrar,
    bonificacion1: bonificacion,
    bonificacion2: bonif2,
    quantity,
    monedaAMostrar,
    tipoCambio,
  })
  // Identificación de oferta como en la grilla (badge Oferta %, countdown y pool)
  const ofertaCountdown = resolveOfertaCountdownContext({
    enOferta: product.enOferta,
    itemProductoVentaEspeciales: product.itemProductoVentaEspeciales,
    ofertaPrecios,
  })
  const isOfertaActiva =
    ofertaPrecios.modoDescuento === 'oferta' && Number(ofertaPrecios.porcentajeOferta) > 0
  const bonifPctBadge = Math.round(
    Number(ofertaPrecios.porcentajeBonificacion1 || 0) +
      Number(ofertaPrecios.porcentajeBonificacion2 || 0) ||
      Number(ofertaPrecios.porcentajeDescuento || 0),
  )
  const isBonifActiva =
    ofertaPrecios.modoDescuento === 'bonificacion' && bonifPctBadge > 0
  const ofertaPool = ofertaCountdown.pool
  const poolProg = ofertaPool?.cierrePorStock
    ? poolStockProgress(ofertaPool.cantidadTotal, ofertaPool.cantidadDisponible)
    : null
  const countdownLabel =
    ofertaCountdown.shouldShow && ofertaPool
      ? formatDiasRestantesCorto(
          computeCountdownProgress(ofertaPool.ofertaDisdes, ofertaPool.ofertaDishas).remainingMs
        )
      : ''
  const precioVentaUnitario = ofertaPrecios.precioOfertaUnitario
  const precioMarcadoUnitario = calcularPrecioPublico(precioMostrar, markupPercentage)
  const subtotalUnit =
    showPublicPrice && markupPercentage > 0 ? precioMarcadoUnitario : precioVentaUnitario
  const subtotal = (Number(quantity) || 0) * (subtotalUnit || 0)
  const discountPercent = (() => {
    if (ofertaPrecios.porcentajeOferta != null && Number(ofertaPrecios.porcentajeOferta) > 0) {
      return Math.round(Number(ofertaPrecios.porcentajeOferta))
    }
    if (tienePrecioListaVisible(precioListaMostrar, precioVentaUnitario)) {
      return Math.round((1 - precioVentaUnitario / precioListaMostrar) * 100)
    }
    if (bonificacion > 0) return Math.round(bonificacion)
    return 0
  })()
  const showListaTachada =
    isLoggedIn && tienePrecioListaVisible(precioListaMostrar, precioVentaUnitario)

  const imageUrls = (product.images || [])
    .map((img) => {
      let url = ''
      if (typeof img === 'string') {
        if (!isValidProductImageUrl(img)) return ''
        url = img
      } else {
        url = (img as { pathImagenGrande?: string }).pathImagenGrande || ''
        if (!isValidProductImageUrl(url)) return ''
      }
      if (url.includes('_min.jpg')) url = url.replace('_min.jpg', '.jpg')
      return url
    })
    .filter((url) => isValidProductImageUrl(url))
  const thumbUrl = imageUrls[0] || ''

  const nroctaParam =
    isStaff(user) && selectedClient?.nrocta ? `?nrocta=${selectedClient.nrocta}` : ''
  const codigo = `${(product.tippro || '').trim()}${(product.artcod || '').trim()}`
  const productUrl = `/producto/${codigo}${nroctaParam}`

  const presentacionesList = (() => {
    if (!Array.isArray(product.presentaciones) || product.presentaciones.length === 0) return []
    const withBarcode = product.presentaciones.filter(
      (p) => (p?.codigoBarra ?? '').toString().trim().length > 0
    )
    return (withBarcode.length > 0 ? withBarcode : product.presentaciones).slice(0, 2)
  })()

  const handleAddToCart = async () => {
    const token = localStorage.getItem('authToken')
    if (!isLoggedIn || !token) {
      toast.error('Debe iniciar sesión para agregar al carrito')
      return
    }
    const staffUser = isStaff(user)
    if (staffUser && !selectedClient) {
      toast.warning('Debe seleccionar un cliente antes de agregar productos', {
        position: 'top-center',
        theme: 'colored',
      })
      return
    }
    setIsAdding(true)
    try {
      let currentCartId = activeCartId
      if (!currentCartId) {
        const activeCart = await dispatch(
          fetchActiveCart({ token, nrocta: selectedClient?.nrocta })
        ).unwrap()
        currentCartId = activeCart?.nrofor
      }
      if (currentCartId) {
        await dispatch(
          addItemToBackend({
            cartId: currentCartId,
            product,
            quantity,
            token,
            nrocta: selectedClient?.nrocta,
            bonificacion2:
              staffUser && bonif2 !== 0 ? -Math.abs(bonif2) : undefined,
          })
        ).unwrap()
        toast.success(`${product.descripcion} agregado al carrito`, {
          position: 'bottom-right',
          autoClose: 2000,
          theme: 'colored',
        })
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error al agregar el producto al carrito'
      toast.error(errorMsg)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveFromCart = async () => {
    const token = localStorage.getItem('authToken')
    if (!token || !cartItem?.itemId || !activeCartId) return
    setIsRemoving(true)
    try {
      await dispatch(
        removeItemFromBackend({
          cartId: activeCartId,
          itemId: cartItem.itemId,
          token,
        })
      ).unwrap()
      toast.info(`${product.descripcion} quitado del carrito`, {
        position: 'bottom-right',
        autoClose: 2000,
        theme: 'colored',
      })
    } catch (error: unknown) {
      if ((error as { code?: string } | null)?.code === CART_READONLY_CODE) return // ya se muestra el modal
      const errorMsg =
        error instanceof Error ? error.message : 'Error al quitar el producto del carrito'
      toast.error(errorMsg)
    } finally {
      setIsRemoving(false)
    }
  }

  const stockBranches = (['NOA', 'NEA', 'BUE', 'CUY'] as const).map((label) => {
    const fallback =
      label === 'NOA'
        ? product.stockNoa
        : label === 'NEA'
          ? product.stockNea
          : label === 'BUE'
            ? product.stockBue
            : product.stockCuy
    return { label, ...branchStockFromList(product.stock, label, fallback) }
  })

  const aPedido = String(product.productoAPedido || '').toUpperCase() === 'S'
  const busy = isAdding || isRemoving || isUpdatingQty || isUpdatingBonif2
  const hasSustitutos = product.tieneSustitutos === 'S'
  const nroctaVinculados =
    isStaff(user) && selectedClient?.nrocta ? selectedClient.nrocta : undefined

  const handleOpenSustitutos = async () => {
    if (!hasSustitutos) return
    setSustitutosOpen(true)
    setLoadingSustitutos(true)
    try {
      setSustitutos(await fetchSustitutos(product.tippro, product.artcod, nroctaVinculados))
    } catch {
      toast.error('Error al cargar productos sustitutos')
      setSustitutos([])
    } finally {
      setLoadingSustitutos(false)
    }
  }

  return (
    <>
      <tr className="group odd:bg-white even:bg-[#fbfcff] hover:bg-blue-50">
        <td className="border border-gray-200 bg-[#f8fafc] px-0.5 py-1.5 text-center font-bold text-slate-500">
          {rowNumber}
        </td>
        <td
          className="overflow-hidden text-ellipsis whitespace-nowrap border border-gray-200 px-1 py-1.5 font-mono text-[10px] text-slate-700"
          title={codigo || undefined}
        >
          <Link
            href={productUrl}
            className="block truncate text-slate-700 hover:text-blue-600 hover:underline"
            title={codigo || undefined}
          >
            {codigo || '—'}
          </Link>
        </td>
        <td
          className="min-w-0 border border-gray-200 px-1 py-1.5 font-bold uppercase text-[#001f3f]"
          title={[product.marca, product.descripcion].filter(Boolean).join(' — ') || undefined}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="group/photo relative flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-100 bg-white"
              title="Ver imágenes"
              aria-label="Ver imágenes del producto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl || PRODUCT_PLACEHOLDER_SMALL}
                alt=""
                className="max-h-7 max-w-7 object-contain mix-blend-multiply"
                onError={(e) => {
                  const target = e.currentTarget
                  if (!target.src.endsWith(PRODUCT_PLACEHOLDER_SMALL)) {
                    target.src = PRODUCT_PLACEHOLDER_SMALL
                  }
                }}
              />
            </button>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
              <span className="product-brand truncate text-[#0e8c85]" title={product.marca || undefined}>
                {product.marca || '—'}
              </span>
              <Link
                href={productUrl}
                className="product-title min-w-0 truncate hover:text-blue-600 hover:underline"
                title={product.descripcion || undefined}
              >
                {product.descripcion || '—'}
              </Link>
              {isLoggedIn && (isOfertaActiva || isBonifActiva || countdownLabel || poolProg) ? (
                <span className="flex flex-wrap items-center gap-1">
                  {isOfertaActiva ? (
                    <span className="discount-badge rounded-full bg-purple-600 px-1.5 py-px font-black text-white shadow-sm">
                      Oferta {Math.round(Number(ofertaPrecios.porcentajeOferta))}%
                    </span>
                  ) : isBonifActiva ? (
                    <span className="discount-badge rounded-full bg-[#e7000b] px-1.5 py-px font-black text-white shadow-sm">
                      Bonif {bonifPctBadge}%
                    </span>
                  ) : null}
                  {countdownLabel ? (
                    <span className="font-bold uppercase text-amber-600">
                      Termina: {countdownLabel}
                    </span>
                  ) : null}
                  {poolProg ? (
                    <span className="font-bold uppercase text-slate-500">
                      Pool {poolProg.consumidos}/{poolProg.meta} ({poolProg.pct}%)
                    </span>
                  ) : null}
                </span>
              ) : null}
            </span>
          </div>
        </td>
        <td
          className="min-w-0 overflow-hidden border border-gray-200 px-1 py-1.5 text-[9px] text-slate-600"
          title={
            presentacionesList.length > 0
              ? presentacionesList
                  .map((p) => {
                    const parts = [
                      unidadPresentacionLabel(p),
                      p?.cantidad != null ? String(p.cantidad) : '',
                      product.unidadMedidaCatalogo || '',
                      pesoPresentacionLabel(p) || '',
                    ].filter((x) => x && String(x).trim())
                    return parts.join(' ').trim()
                  })
                  .filter(Boolean)
                  .join('\n')
              : undefined
          }
        >
          {presentacionesList.length > 0 ? (
            <div className="space-y-0.5 overflow-hidden">
              {presentacionesList.map((p, i) => {
                const line = [
                  unidadPresentacionLabel(p),
                  p?.cantidad != null ? String(p.cantidad) : '',
                  product.unidadMedidaCatalogo || '',
                  pesoPresentacionLabel(p) || '',
                ]
                  .filter((x) => x && String(x).trim())
                  .join(' ')
                  .trim()
                return (
                  <div key={`${p?.tipoEnvase ?? 'x'}-${i}`} className="truncate" title={line || undefined}>
                    {line || '—'}
                  </div>
                )
              })}
            </div>
          ) : (
            '—'
          )}
        </td>
        {isLoggedIn ? (
          aPedido ? (
            <td
              colSpan={4}
              className="border border-gray-200 px-2 py-1.5 text-center text-[9px] font-semibold text-amber-700"
            >
              A pedido
            </td>
          ) : (
            stockBranches.map((b) => (
              <StockCell
                key={b.label}
                label={b.label}
                stock={b.cantidad}
                estado={b.estado}
                userTipo={user?.tipo}
                verStock={user?.verStock}
              />
            ))
          )
        ) : (
          <td colSpan={4} className="border border-gray-200 px-2 py-1.5 text-center text-[9px] text-slate-400">
            —
          </td>
        )}
        {showPurchasePrice && (
          <td data-price className="min-w-0 border border-gray-200 px-1 py-1.5 text-[#0e8c85]">
            {isLoggedIn ? (
              <div className="min-w-0 overflow-hidden text-right">
                <span className="final-price block truncate">
                  {simboloMoneda}{format(precioVentaUnitario)}
                </span>
                {showListaTachada ? (
                  <span className="block truncate text-gray-400 line-through">
                    {simboloMoneda}{format(precioListaMostrar)}
                  </span>
                ) : null}
              </div>
            ) : (
              '—'
            )}
          </td>
        )}
        {showPublicPrice && (
          <td
            data-price
            className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border border-gray-200 px-1 py-1.5 text-right font-black text-orange-500"
          >
            {isLoggedIn && markupPercentage > 0
              ? `${simboloMoneda}${format(precioMarcadoUnitario)}`
              : '—'}
          </td>
        )}
        <td className="border border-gray-200 px-0.5 py-1.5 text-center">
          {hasSustitutos ? (
            <button
              type="button"
              onClick={() => void handleOpenSustitutos()}
              className="text-[9px] font-bold text-[#1a79ff] hover:underline"
            >
              Ver
            </button>
          ) : (
            <span className="text-[9px] text-slate-400">—</span>
          )}
        </td>
        <td className="border border-gray-200 px-0.5 py-1.5 text-center">
          {isLoggedIn ? (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantity}
              disabled={busy}
              data-spreadsheet-cell
              data-row={rowIndex}
              data-col={0}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setQuantityFromUi(raw === '' ? 1 : Math.max(1, Number(raw)))
              }}
              onKeyDown={(e) => handleSpreadsheetArrowNav(e, rowIndex, 0)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Cantidad"
              className={`${SPREADSHEET_INPUT_CLASS} text-[#001f3f]`}
            />
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        {showBonif2 && (
          <td className="border border-gray-200 px-0.5 py-1.5 text-center">
            {isLoggedIn ? (
              <input
                type="text"
                inputMode="decimal"
                value={bonif2Text}
                disabled={busy}
                data-spreadsheet-cell
                data-row={rowIndex}
                data-col={1}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d.]/g, '')
                  const firstDot = raw.indexOf('.')
                  const limited =
                    firstDot === -1
                      ? raw
                      : `${raw.slice(0, firstDot + 1)}${raw
                          .slice(firstDot + 1)
                          .replace(/\./g, '')
                          .slice(0, 2)}`
                  setBonif2Text(limited)
                  if (limited === '' || limited === '.') {
                    setBonif2FromUi(0)
                    return
                  }
                  if (limited.endsWith('.')) return
                  const n = Number(limited)
                  if (Number.isFinite(n)) setBonif2FromUi(n)
                }}
                onBlur={() => {
                  const n = Number(bonif2Text)
                  const next = Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0
                  setBonif2FromUi(next)
                  setBonif2Text(String(next))
                }}
                onKeyDown={(e) => handleSpreadsheetArrowNav(e, rowIndex, 1)}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Bonificación 2 %"
                className={`${SPREADSHEET_INPUT_CLASS} text-red-600 focus:border-red-400`}
              />
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </td>
        )}
        <td className="min-w-0 border border-gray-200 px-0.5 py-1.5">
          {isLoggedIn ? (
            isInCart ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRemoveFromCart()}
                title="Quitar del carrito"
                className="inline-flex h-7 w-full min-w-0 items-center justify-center gap-0.5 rounded border border-orange-200 bg-orange-50 px-1 text-[9px] font-black uppercase text-orange-600 hover:bg-orange-100 disabled:opacity-50"
              >
                {isRemoving ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : <Trash2 className="h-3 w-3 shrink-0" />}
                <span className="truncate">Quitar</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || Number(quantity) <= 0}
                onClick={() => void handleAddToCart()}
                title="Agregar al carrito"
                className="inline-flex h-7 w-full min-w-0 items-center justify-center gap-0.5 rounded bg-[#001f3f] px-1 text-[9px] font-black uppercase text-white hover:bg-[#003366] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdding ? (
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">Agregar</span>
              </button>
            )
          ) : (
            <span className="block truncate text-center text-[8px] font-semibold text-slate-400">Login</span>
          )}
        </td>
        <td
          data-subtotal
          className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border border-gray-200 bg-[#f8fafc] px-1 py-1.5 text-right font-black text-[#001f3f]"
        >
          {isLoggedIn ? `${simboloMoneda}${format(subtotal)}` : '—'}
        </td>
      </tr>

      {galleryOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <ProductGalleryModal
            images={imageUrls.length > 0 ? imageUrls : product.images || []}
            initialIndex={0}
            onClose={() => setGalleryOpen(false)}
          />,
          document.body
        )}

      {sustitutosOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <ProductosVinculadosModal
            isOpen={sustitutosOpen}
            onClose={() => setSustitutosOpen(false)}
            title={`Sustitutos para ${product.descripcion || codigo}`}
            items={sustitutos}
            loading={loadingSustitutos}
            emptyMessage="Los sustitutos para este producto no están disponibles en estos momentos."
          />,
          document.body
        )}
    </>
  )
}

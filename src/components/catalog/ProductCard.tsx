'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { addItemToBackend, fetchActiveCart, removeItemFromBackend } from '../../store/cartSlice'
import { useSyncedCartQuantity } from '@/hooks/useSyncedCartQuantity'
import { useSyncedBonif2FromCart } from '@/hooks/useSyncedBonif2FromCart'
import ProductGalleryModal from './ProductGalleryModal'
import AplicacionesMotocicletaModal from './AplicacionesMotocicletaModal'
import { ProductUI } from '../../models/ProductUI'
import { useCurrency } from '../../hooks/useCurrencyPreference'
import { useCatalogUI } from '../../context/CatalogUIContext'
import Modal from '../modals/Modal'
import { toast } from 'react-toastify'
import { ArrowLeft, ArrowLeftRight, ArrowRight, Bike, Heart, Info, Link2, Loader2, ShoppingCart, Trash2 } from 'lucide-react'
import { favoriteKey, setFavoriteLocal, toggleFavorite } from '../../store/favoritesSlice'
import OfertaPrecioDisplay from './OfertaPrecioDisplay'
import DescuentoCornerBadges from './DescuentoCornerBadges'
import NuevoProductBadge from './NuevoProductBadge'
import { resolveOfertaPrecios, debeMostrarPrecioPromocional } from '@/utils/ofertaPrecios'
import { resolveOfertaCountdownContext } from '@/utils/ofertaCountdown'
import { resolvePreciosMoneda, calcularPrecioPublico } from '@/utils/productoPrecios'
import { isValidProductImageUrl, PRODUCT_PLACEHOLDER } from '@/utils/productImage'
import OfertaCountdownBanner from './OfertaCountdownBanner'
import PoolStockProgressBar from './PoolStockProgressBar'
import ProductosVinculadosModal from './ProductosVinculadosModal'
import StockItem from './StockItem'
import { branchStockFromList } from '@/utils/stockBattery'
import { fetchSustitutos, fetchRelacionados } from '@/services/products'
import type { ProductoDTO } from '@/interfaces/producto'
import { isProductoNuevo } from '@/utils/productoNuevo'
import { unidadPresentacionLabel, pesoPresentacionLabel } from '@/utils/productPresentacionLabels'
import { isStaff } from '@/utils/auth'
import { CART_READONLY_CODE } from '@/services/cart'

export default function ProductCard({
    product,
    embeddedInVinculados = false,
}: {
    product: ProductUI
    embeddedInVinculados?: boolean
}) {
    // Obtener estado de autenticación y carrito
    const { isLoggedIn, selectedClient, user } = useSelector((state: RootState) => state.auth)
    const { activeCartId, loading, items: cartItems } = useSelector((state: RootState) => state.cart)
    const favoritesKeys = useSelector((state: RootState) => state.favorites.keys)
    const dispatch = useDispatch<AppDispatch>()
    const [isAdding, setIsAdding] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    // Verificar si el producto ya está en el carrito
    const cartItem = (cartItems || []).find(item => {
        if (!item.tippro || !item.artcod || !product.tippro || !product.artcod) return false;
        return item.tippro.toString().trim().toUpperCase() === product.tippro.toString().trim().toUpperCase() &&
            item.artcod.toString().trim().toUpperCase() === product.artcod.toString().trim().toUpperCase();
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

    const { quantity, setQuantityFromUi, isUpdatingQty } = useSyncedCartQuantity({
        isInCart,
        cartItemId: cartItem?.itemId,
        cartQuantity: cartItem?.quantity,
        activeCartId: activeCartId ?? undefined,
    })

    const handleAddToCart = async () => {
        const token = localStorage.getItem('authToken')
        if (!isLoggedIn || !token) {
            toast.error('Debe iniciar sesión para agregar al carrito')
            return
        }

        // Validar que el vendedor/admin haya seleccionado un cliente
        const isStaff = user?.tipo === 'V' || user?.tipo === 'A' || user?.tipo === 'S' || user?.tipo === 'B'
        if (isStaff && !selectedClient) {
            toast.warning('Debe seleccionar un cliente antes de agregar productos', {
                position: "top-center",
                theme: "colored"
            })
            // Opcionalmente hacer scroll al selector o enfocarlo
            return
        }

        setIsAdding(true)
        try {
            let currentCartId = activeCartId

            // Si por alguna razón no tenemos el ID del carrito, intentamos recuperarlo/crearlo
            if (!currentCartId) {
                const activeCart = await dispatch(fetchActiveCart({
                    token,
                    nrocta: selectedClient?.nrocta
                })).unwrap()
                currentCartId = activeCart?.nrofor
            }

            if (currentCartId) {
                await dispatch(addItemToBackend({
                    cartId: currentCartId,
                    product,
                    quantity,
                    token,
                    nrocta: selectedClient?.nrocta,
                    bonificacion2: (user?.tipo === 'V' || user?.tipo === 'A' || user?.tipo === 'S' || user?.tipo === 'B') && bonif2 !== 0
                        ? -Math.abs(bonif2)
                        : undefined
                })).unwrap()
                toast.success(`${product.descripcion} agregado al carrito`, {
                    position: "bottom-right",
                    autoClose: 2000,
                    theme: "colored",
                })
            }
        } catch (error: any) {
            if (error?.code === CART_READONLY_CODE) return // ya se muestra el modal
            const errorMsg = error?.message || 'Error al agregar el producto al carrito';
            toast.error(errorMsg);
            console.error(error);
        } finally {
            setIsAdding(false)
        }
    }

    const handleRemoveFromCart = async () => {
        const token = localStorage.getItem('authToken')
        if (!token || !cartItem?.itemId) return

        setIsRemoving(true)
        try {
            await dispatch(removeItemFromBackend({
                cartId: activeCartId!,
                itemId: cartItem.itemId,
                token
            })).unwrap()
            toast.info(`${product.descripcion} quitado del carrito`, {
                position: "bottom-right",
                autoClose: 2000,
                theme: "colored",
            })
        } catch (error: any) {
            const errorMsg = error?.message || 'Error al quitar el producto del carrito';
            toast.error(errorMsg);
        } finally {
            setIsRemoving(false)
        }
    }

    const { markupPercentage, showPurchasePrice, showPublicPrice } = useCatalogUI()
    const [galleryOpen, setGalleryOpen] = useState(false)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const [showMarkupAlert, setShowMarkupAlert] = useState(false)
    const [aplicacionesModalOpen, setAplicacionesModalOpen] = useState(false)
    const [sustitutosOpen, setSustitutosOpen] = useState(false)
    const [relacionadosOpen, setRelacionadosOpen] = useState(false)
    const [sustitutos, setSustitutos] = useState<ProductoDTO[]>([])
    const [relacionados, setRelacionados] = useState<ProductoDTO[]>([])
    const [loadingSustitutos, setLoadingSustitutos] = useState(false)
    const [loadingRelacionados, setLoadingRelacionados] = useState(false)

    // Preference for currency display (read-only, toggle is in CatalogHeader)
    const { currency } = useCurrency()

    if (!product) return null

    const format = (val: number) =>
        new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)

    const precioReferenciaARS = product.precioReferencia || 0
    const precioFinalARS = product.precioFinalPeso || 0
    const bonificacion = product.bonificacion ? Math.abs(Number(product.bonificacion)) : 0

    const {
        monedaAMostrar,
        simboloMoneda,
        tipoCambio,
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
    const precioMarcadoMostrar = calcularPrecioPublico(precioMostrar, markupPercentage)
    const precioVentaUnitario = ofertaPrecios.precioOfertaUnitario
    const precioVentaTotal = ofertaPrecios.precioOferta
    const precioTotalMarcadoMostrar = (precioMarcadoMostrar || 0) * (quantity || 1)
    const showPrecioPromocional = debeMostrarPrecioPromocional(ofertaPrecios)
    const badgeModo = ofertaPrecios.modoDescuento === 'oferta'
        ? 'oferta' as const
        : bonificacion > 0
            ? 'bonificacion' as const
            : 'ninguno' as const
    const ofertaCountdown = resolveOfertaCountdownContext({
        enOferta: product.enOferta,
        itemProductoVentaEspeciales: product.itemProductoVentaEspeciales,
        ofertaPrecios,
    })
    const images = product.images || []
    const imageUrls = images.map(img => {
        let url = ''
        if (typeof img === 'string') {
            if (!isValidProductImageUrl(img)) return ''
            url = img
        } else {
            url = (img as any).pathImagenGrande
            if (!isValidProductImageUrl(url)) return ''
        }
        if (url.includes('_min.jpg')) url = url.replace('_min.jpg', '.jpg')
        return url
    }).filter(url => isValidProductImageUrl(url))

    const hasMultipleImages = imageUrls.length > 1
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const currentImageUrl = imageUrls[currentImageIndex] || ''
    const [loadingImg, setLoadingImg] = useState(false)

    useEffect(() => {
        if (currentImageUrl) {
            const img = new window.Image()
            img.src = currentImageUrl
            if (!img.complete) setLoadingImg(true)
            else setLoadingImg(false)
        }
    }, [currentImageUrl])

    const openGallery = (index: number = 0) => {
        setGalleryIndex(index)
        setGalleryOpen(true)
    }

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length)
    }

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)
    }

    const nextImageSimple = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length)
    }

    const nroctaParam = isStaff(user) && selectedClient?.nrocta ? `?nrocta=${selectedClient.nrocta}` : '';
    const productUrl = `/producto/${(product.tippro || '').trim()}${(product.artcod || '').trim()}${nroctaParam}`

    const favKey = favoriteKey(product.tippro, product.artcod)
    const isFav = !!favoritesKeys[favKey]

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isLoggedIn) {
            toast.info('Iniciá sesión para agregar a favoritos')
            return
        }
        const token = localStorage.getItem('authToken')
        if (!token) {
            toast.error('La sesión ha expirado')
            return
        }
        const nextIsFavorite = !isFav
        dispatch(setFavoriteLocal({ key: favKey, isFavorite: nextIsFavorite }))
        try {
            await dispatch(toggleFavorite({ token, tippro: product.tippro, artcod: product.artcod, nextIsFavorite })).unwrap()
            toast.success(nextIsFavorite ? 'Producto agregado a favoritos' : 'Producto eliminado de favoritos')
        } catch {
            dispatch(setFavoriteLocal({ key: favKey, isFavorite: isFav }))
            toast.error('No se pudo actualizar favoritos')
        }
    }

    const nroctaVinculados = isStaff(user) && selectedClient?.nrocta
        ? selectedClient.nrocta
        : undefined

    const hasSustitutos = product.tieneSustitutos === 'S'
    const hasRelacionados = product.tieneRelacionados === 'S'

    const handleOpenSustitutos = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!hasSustitutos) return
        setSustitutosOpen(true)
        setLoadingSustitutos(true)
        try {
            setSustitutos(await fetchSustitutos(product.tippro, product.artcod, nroctaVinculados))
        } finally {
            setLoadingSustitutos(false)
        }
    }

    const handleOpenRelacionados = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!hasRelacionados) return
        setRelacionadosOpen(true)
        setLoadingRelacionados(true)
        try {
            setRelacionados(await fetchRelacionados(product.tippro, product.artcod, nroctaVinculados))
        } finally {
            setLoadingRelacionados(false)
        }
    }

    return (
        <>
            <div className={`bg-white border border-gray-100 rounded-[10px] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full min-h-0 relative overflow-hidden group ${embeddedInVinculados ? 'max-h-[min(520px,70vh)]' : ''}`}>

                <DescuentoCornerBadges
                    modoDescuento={badgeModo}
                    bonificacion1={bonificacion}
                    porcentajeOferta={ofertaPrecios.porcentajeOferta}
                    size="card"
                    visible={isLoggedIn}
                />

                {/* Acciones Rápidas Izquierda */}
                <div className="absolute left-3 top-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-100 rounded-lg shadow-sm transition-colors"
                        title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                        <Heart
                            size={14}
                            className={isFav ? 'text-[#fb923c]' : 'text-gray-400 hover:text-blue-600'}
                            fill={isFav ? '#fb923c' : 'none'}
                        />
                    </button>
                    {!embeddedInVinculados && (
                    <button
                        type="button"
                        title={hasSustitutos ? 'Ver productos sustitutos/sugeridos' : 'Sin productos sustitutos'}
                        onClick={handleOpenSustitutos}
                        disabled={!hasSustitutos}
                        className={`w-7 h-7 flex items-center justify-center border rounded-lg shadow-sm transition-colors ${hasSustitutos
                            ? 'bg-white border-gray-100 text-gray-400 hover:text-blue-600'
                            : 'bg-gray-100 border-gray-100 text-gray-300 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <ArrowLeftRight size={14} />
                    </button>
                    )}
                    {!embeddedInVinculados && (
                    <button
                        type="button"
                        title={hasRelacionados ? 'Ver productos relacionados' : 'Sin productos relacionados'}
                        onClick={handleOpenRelacionados}
                        disabled={!hasRelacionados}
                        className={`w-7 h-7 flex items-center justify-center border rounded-lg shadow-sm transition-colors ${hasRelacionados
                            ? 'bg-white border-gray-100 text-gray-400 hover:text-blue-600'
                            : 'bg-gray-100 border-gray-100 text-gray-300 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Link2 size={14} />
                    </button>
                    )}
                    <button
                        type="button"
                        title="Aplicaciones por motocicleta"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setAplicacionesModalOpen(true)
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-blue-600 shadow-sm transition-colors"
                    >
                        <Bike size={14} />
                    </button>
                    <Link
                        href={productUrl}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.location.href = productUrl
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-blue-600 shadow-sm transition-colors"
                        title="Detalle"
                    >
                        <Info size={14} />
                    </Link>
                </div>

                {/* Contenedor Imagen */}
                <div
                    className={`relative p-4 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 ${embeddedInVinculados ? 'h-36' : 'h-52'}`}
                    onClick={() => setGalleryOpen(true)}
                >
                    {loadingImg && <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10"><Loader2 className="animate-spin text-blue-600" /></div>}
                    <img
                        src={currentImageUrl || PRODUCT_PLACEHOLDER}
                        alt={product.descripcion}
                        className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        onLoad={() => setLoadingImg(false)}
                        onError={(e) => {
                            const target = e.currentTarget
                            if (!target.src.endsWith(PRODUCT_PLACEHOLDER)) {
                                target.src = PRODUCT_PLACEHOLDER
                            }
                            setLoadingImg(false)
                        }}
                    />

                    {/* Flechas de slider (solo si hay más de 1) */}
                    {imageUrls.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={prevImage}
                                className={`absolute top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/85 backdrop-blur shadow border border-white/60 flex items-center justify-center z-10 ${embeddedInVinculados ? 'left-2 opacity-90' : 'left-14 opacity-0 group-hover:opacity-100'} transition-opacity`}
                                title="Anterior"
                            >
                                <ArrowLeft className="h-4 w-4 text-[#001f3f]" />
                            </button>
                            <button
                                type="button"
                                onClick={nextImageSimple}
                                className={`absolute top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/85 backdrop-blur shadow border border-white/60 flex items-center justify-center z-10 ${embeddedInVinculados ? 'right-2 opacity-90' : 'right-3 opacity-0 group-hover:opacity-100'} transition-opacity`}
                                title="Siguiente"
                            >
                                <ArrowRight className="h-4 w-4 text-[#001f3f]" />
                            </button>

                            {/* Contador 1/2 */}
                            {/* <div className="absolute bottom-3 left-3 bg-black/55 text-white text-[10px] font-black px-2 py-1 rounded-full backdrop-blur-sm">
                                {currentImageIndex + 1}/{imageUrls.length}
                            </div> */}
                        </>
                    )}

                    {/* Indicador de Páginas Estilo Minimalista */}
                    {imageUrls.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm shadow-sm">
                            {imageUrls.map((_, idx) => (
                                <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-blue-600' : 'w-1 bg-gray-300'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Información del Producto */}
                <div className={`flex flex-col flex-1 min-h-0 ${embeddedInVinculados ? 'px-4 pb-4' : 'px-5 pb-5 flex-grow'}`}>
                    <div className={`shrink-0 ${embeddedInVinculados ? 'mb-1' : 'mb-2'}`}>
                        <div className="mb-1">
                            <NuevoProductBadge
                                visible={isProductoNuevo(product.nuevo)}
                                size="card"
                            />
                        </div>
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-tighter mb-1">{product.marca}</p>
                        <Link href={`/producto/${product.tippro?.trim()}${product.artcod?.trim()}`}>
                            <h3 className="text-xs font-black text-gray-800 leading-snug uppercase line-clamp-2 min-h-[2.2em] tracking-tighter hover:text-blue-600 transition-colors">
                                {product.descripcion}
                            </h3>
                        </Link>
                        <p className="text-[11px] font-medium text-gray-400 mt-1">Cod: {product.tippro}{product.artcod}</p>
                    </div>

                    {/* Envase / Presentación (una por línea) */}
                    {Array.isArray(product.presentaciones) && product.presentaciones.length > 0 && (
                        <div className={`shrink-0 space-y-1 ${embeddedInVinculados ? 'mb-2' : 'mb-4'}`}>
                            {(() => {
                                const withBarcode = product.presentaciones.filter(
                                    (p: any) => (p?.codigoBarra ?? '').toString().trim().length > 0
                                )
                                const maxItems = embeddedInVinculados ? 1 : 2
                                const list = (withBarcode.length > 0 ? withBarcode : product.presentaciones).slice(0, maxItems)
                                return list.map((p: any, i: number) => (
                                    <div
                                        key={`${p?.tipoEnvase ?? 'x'}-${i}`}
                                        className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 w-fit"
                                    >
                                        {i + 1}° Envase
                                        {unidadPresentacionLabel(p) ? ` ${unidadPresentacionLabel(p)}` : ''}
                                        {p?.cantidad != null ? ` ${p.cantidad}` : ''}
                                        {product.unidadMedidaCatalogo ? ` ${product.unidadMedidaCatalogo}` : ''}
                                        {pesoPresentacionLabel(p) ? ` ${pesoPresentacionLabel(p)}` : ''}
                                    </div>
                                ))
                            })()}
                        </div>
                    )}

                    {isLoggedIn ? (
                        <div className={`flex flex-col flex-1 min-h-0 ${embeddedInVinculados ? 'mt-1' : 'mt-auto space-y-4'}`}>
                            <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${embeddedInVinculados ? 'space-y-2' : 'space-y-4'}`}>
                            {/* Precios */}
                            <div className={`pt-3 border-t border-gray-50 ${embeddedInVinculados ? 'pt-2' : ''}`}>
                                {showPurchasePrice && (
                                    showPrecioPromocional ? (
                                        <OfertaPrecioDisplay
                                            oferta={ofertaPrecios}
                                            simboloMoneda={simboloMoneda}
                                            format={format}
                                            quantity={quantity}
                                            variant="card"
                                        />
                                    ) : (
                                        <div className="mb-1">
                                            <p className="text-[9.6px] text-gray-400 font-medium uppercase tracking-tighter">
                                                {quantity > 1 ? `Total (${quantity} u.)` : 'Precio Final'}
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[20px] font-black text-slate-900 leading-none tracking-tighter">
                                                    {simboloMoneda}{format(quantity > 1 ? precioVentaTotal : precioVentaUnitario)}
                                                </span>
                                            </div>
                                            {quantity > 1 && (
                                                <p className="text-[10px] font-bold text-gray-400">
                                                    Unit.: {simboloMoneda}{format(precioVentaUnitario)}
                                                </p>
                                            )}
                                        </div>
                                    )
                                )}
                                {showPublicPrice && markupPercentage > 0 && (
                                    <div className="flex flex-col">
                                        <span className="text-[9.6px] font-medium text-gray-400 uppercase">Precio Público:</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[15px] font-semibold text-[#fb923c] leading-none">
                                                {simboloMoneda}{format(quantity > 1 ? precioTotalMarcadoMostrar : precioMarcadoMostrar)}
                                            </span>
                                        </div>
                                        {quantity > 1 && (
                                            <span className="text-[10px] font-bold text-gray-400">
                                                Unit.: {simboloMoneda}{format(precioMarcadoMostrar)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {ofertaCountdown.shouldShow && ofertaCountdown.pool && !embeddedInVinculados && (
                                <OfertaCountdownBanner
                                    pool={ofertaCountdown.pool}
                                    variant="card"
                                    visible={isLoggedIn}
                                />
                            )}

                            {ofertaCountdown.pool?.cierrePorStock && !embeddedInVinculados && (
                                <PoolStockProgressBar
                                    cantidadTotal={ofertaCountdown.pool.cantidadTotal}
                                    cantidadDisponible={ofertaCountdown.pool.cantidadDisponible}
                                    variant="card"
                                />
                            )}

                            {/* Stocks estilo Batería */}
                            {String(product.productoAPedido || '').toUpperCase() === 'S' ? (
                                <p className="text-[10px] text-amber-700 font-semibold text-center px-1">
                                    Producto a pedido. Consultar por favor.
                                </p>
                            ) : null}
                            <div className={`grid grid-cols-4 gap-1 py-2 bg-gray-50/50 rounded-xl border border-gray-50 ${embeddedInVinculados ? 'py-1.5' : ''}`}>
                                {(['NOA', 'NEA', 'BUE', 'CUY'] as const).map((label) => {
                                    const fallback =
                                        label === 'NOA' ? product.stockNoa
                                        : label === 'NEA' ? product.stockNea
                                        : label === 'BUE' ? product.stockBue
                                        : product.stockCuy;
                                    const branch = branchStockFromList(product.stock, label, fallback);
                                    return (
                                        <StockItem
                                            key={label}
                                            label={label}
                                            stock={branch.cantidad}
                                            estado={branch.estado}
                                            userTipo={user?.tipo}
                                            verStock={user?.verStock}
                                        />
                                    );
                                })}
                            </div>

                            {/* Bonif 2 (Solo Staff) */}
                            {['V', 'A', 'S', 'B'].includes(user?.tipo || '') && (
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Bonificación %:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={bonif2}
                                        disabled={isAdding || isRemoving || isUpdatingBonif2}
                                        onChange={(e) => setBonif2FromUi(Number(e.target.value))}
                                        className="w-14 h-7 border border-gray-200 rounded-md text-center font-bold text-red-600 text-xs outline-none focus:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </div>
                            )}
                            </div>

                            {/* Controles de Compra */}
                            <div className={`flex shrink-0 gap-2 ${embeddedInVinculados ? 'pt-2 border-t border-gray-50' : ''}`}>
                                <button
                                    onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
                                    disabled={isAdding || isRemoving || loading || isUpdatingQty}
                                    className={`flex-grow rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-tighter transition-all active:scale-95 shadow-sm ${embeddedInVinculados ? 'h-10' : 'h-11'} ${isInCart
                                        ? 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100'
                                        : 'bg-[#0056b3] text-white hover:bg-[#004085]'
                                        }`}
                                >
                                    {isAdding || isRemoving ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : isInCart ? (
                                        <><Trash2 size={16} /> Quitar</>
                                    ) : (
                                        <><ShoppingCart size={16} /> Agregar</>
                                    )}
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantityFromUi(parseInt(e.target.value, 10) || 1)}
                                    disabled={isAdding || isRemoving || loading || isUpdatingQty}
                                    className={`w-14 border border-gray-100 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60 ${embeddedInVinculados ? 'h-10' : 'h-11'}`}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-auto py-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Inicie sesión para precios</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            {galleryOpen && (
                <ProductGalleryModal images={images} initialIndex={0} onClose={() => setGalleryOpen(false)} />
            )}

            <AplicacionesMotocicletaModal
                isOpen={aplicacionesModalOpen}
                onClose={() => setAplicacionesModalOpen(false)}
                aplicaciones={product.aplicaciones}
            />

            {!embeddedInVinculados && (
            <>
            <ProductosVinculadosModal
                isOpen={sustitutosOpen}
                onClose={() => setSustitutosOpen(false)}
                title="Productos sustitutos"
                items={sustitutos}
                loading={loadingSustitutos}
                emptyMessage="Los sustitutos para este producto no están disponibles en estos momentos."
            />

            <ProductosVinculadosModal
                isOpen={relacionadosOpen}
                onClose={() => setRelacionadosOpen(false)}
                title="Productos relacionados"
                items={relacionados}
                loading={loadingRelacionados}
                emptyMessage="Los relacionados para este producto no están disponibles en estos momentos."
            />
            </>
            )}

            <Modal isOpen={showMarkupAlert} onClose={() => setShowMarkupAlert(false)}>
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">Markup no configurado</h3>
                    <p className="text-gray-600 mb-4">Ingrese un porcentaje en la barra superior.</p>
                    <button onClick={() => setShowMarkupAlert(false)} className="bg-blue-900 text-white py-2 px-6 rounded-lg">Cerrar</button>
                </div>
            </Modal>
        </>
    )
}


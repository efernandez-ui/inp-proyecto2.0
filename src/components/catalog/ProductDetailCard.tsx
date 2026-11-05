'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { addItemToBackend, fetchActiveCart, removeItemFromBackend } from '../../store/cartSlice'
import { useSyncedCartQuantity } from '@/hooks/useSyncedCartQuantity'
import { useSyncedBonif2FromCart } from '@/hooks/useSyncedBonif2FromCart'
import { toast } from 'react-toastify'
import { ArrowLeftRight, Bike, Heart, Info, Link2, Loader2, RotateCcw } from 'lucide-react'
import { favoriteKey, setFavoriteLocal, toggleFavorite } from '../../store/favoritesSlice'
import ProductGalleryModal from './ProductGalleryModal'
import AplicacionesMotocicletaModal from './AplicacionesMotocicletaModal'
import { ProductUI } from '../../models/ProductUI'
import { useCurrency } from '../../hooks/useCurrencyPreference'
import { useCatalogUI } from '../../context/CatalogUIContext'
import Modal from '../modals/Modal'
import OfertaPrecioDisplay from './OfertaPrecioDisplay'
import DescuentoCornerBadges from './DescuentoCornerBadges'
import NuevoProductBadge from './NuevoProductBadge'
import { resolveOfertaPrecios, debeMostrarPrecioPromocional } from '@/utils/ofertaPrecios'
import { resolveOfertaCountdownContext } from '@/utils/ofertaCountdown'
import { resolvePreciosMoneda, calcularPrecioPublico, tienePrecioListaVisible } from '@/utils/productoPrecios'
import { isValidProductImageUrl, PRODUCT_PLACEHOLDER } from '@/utils/productImage'
import OfertaCountdownBanner from './OfertaCountdownBanner'
import ProductosVinculadosModal from './ProductosVinculadosModal'
import BranchStockDisplay from './BranchStockDisplay'
import { fetchSustitutos, fetchRelacionados } from '@/services/products'
import type { ProductoDTO } from '@/interfaces/producto'
import { isProductoNuevo } from '@/utils/productoNuevo'
import { unidadPresentacionLabel, pesoPresentacionLabel } from '@/utils/productPresentacionLabels'
import { isStaff } from '@/utils/auth'
import { CART_READONLY_CODE } from '@/services/cart'

export default function ProductDetailCard({ product }: { product: ProductUI }) {
    // Obtener estado de autenticación y carrito
    const { isLoggedIn, selectedClient, user } = useSelector((state: RootState) => state.auth)
    const { activeCartId, loading, items: cartItems } = useSelector((state: RootState) => state.cart)
    const favoritesKeys = useSelector((state: RootState) => state.favorites.keys)
    const dispatch = useDispatch<AppDispatch>()
    const { markupPercentage, showPurchasePrice, showPublicPrice } = useCatalogUI()
    const [galleryOpen, setGalleryOpen] = useState(false)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const [showMarkupAlert, setShowMarkupAlert] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [loadingImg, setLoadingImg] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [aplicacionesModalOpen, setAplicacionesModalOpen] = useState(false)
    const [sustitutosOpen, setSustitutosOpen] = useState(false)
    const [relacionadosOpen, setRelacionadosOpen] = useState(false)
    const [sustitutos, setSustitutos] = useState<ProductoDTO[]>([])
    const [relacionados, setRelacionados] = useState<ProductoDTO[]>([])
    const [loadingSustitutos, setLoadingSustitutos] = useState(false)
    const [loadingRelacionados, setLoadingRelacionados] = useState(false)

    // Verificar si el producto ya está en el carrito
    const cartItem = cartItems.find(item =>
        item.tippro.trim() === product.tippro.trim() &&
        item.artcod.trim() === product.artcod.trim()
    )
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
            return
        }

        setIsAdding(true)
        try {
            let currentCartId = activeCartId

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
            const errorMsg = error?.message || 'Error al quitar el producto al carrito';
            toast.error(errorMsg);
            console.error(error);
        } finally {
            setIsRemoving(false)
        }
    }

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
            if (!isValidProductImageUrl(img)) {
                return ''
            }
            url = img
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const item = img as any
            url = item.pathImagenGrande
            if (!isValidProductImageUrl(url)) {
                return ''
            }
        }
        if (url.includes('_min.jpg')) {
            url = url.replace('_min.jpg', '.jpg')
        }
        return url
    }).filter(url => isValidProductImageUrl(url))

    const mainImageUrl = imageUrls[currentImageIndex] || ''
    const hasMultipleImages = imageUrls.length > 1

    // Resetear índice cuando cambia el producto
    useEffect(() => {
        setCurrentImageIndex(0)
    }, [product.artcod])

    // Resetear loadingImg cuando cambia la URL de la imagen
    useEffect(() => {
        if (mainImageUrl && mainImageUrl.length > 0) {
            const img = new window.Image()
            img.src = mainImageUrl
            if (img.complete) {
                setLoadingImg(false)
            } else {
                setLoadingImg(true)
            }
        } else {
            setLoadingImg(false)
        }
    }, [mainImageUrl])

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

    const nroctaParam = isStaff(user) && selectedClient?.nrocta ? `?nrocta=${selectedClient.nrocta}` : '';
    const productUrl = `/producto/${(product.tippro || '').trim()}${(product.artcod || '').trim()}${nroctaParam}`

    const presentaciones = Array.isArray(product.presentaciones) ? product.presentaciones : []

    const favKey = favoriteKey(product.tippro, product.artcod)
    const isFav = !!favoritesKeys[favKey]

    const handleToggleFavorite = async () => {
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

    const hasSustitutos = product.tieneSustitutos === 'S'
    const hasRelacionados = product.tieneRelacionados === 'S'
    const nroctaVinculados = isStaff(user) && selectedClient?.nrocta
        ? selectedClient.nrocta
        : undefined

    const handleOpenSustitutos = async () => {
        if (!hasSustitutos) return
        setSustitutosOpen(true)
        setLoadingSustitutos(true)
        try {
            setSustitutos(await fetchSustitutos(product.tippro, product.artcod, nroctaVinculados))
        } finally {
            setLoadingSustitutos(false)
        }
    }

    const handleOpenRelacionados = async () => {
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
            <li className="bg-white border border-gray-200 shadow-sm p-3 sm:p-4 md:p-5 flex flex-row items-stretch gap-3 sm:gap-4 md:gap-5 relative h-full font-sans min-h-[11rem] sm:min-h-[12.5rem] md:min-h-[14rem]">
                <DescuentoCornerBadges
                    modoDescuento={badgeModo}
                    bonificacion1={bonificacion}
                    porcentajeOferta={ofertaPrecios.porcentajeOferta}
                    size="list"
                    visible={isLoggedIn}
                />
                {/* Acciones — columna fija; el ancho extra lo usa la imagen */}
                <div className="hidden sm:flex flex-col items-center justify-center gap-2 shrink-0 w-9 md:w-10 z-40 opacity-80 hover:opacity-100 transition-opacity">
                    <IconPill title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"} onClick={handleToggleFavorite}>
                        <Heart className={isFav ? "h-4 w-4 text-[#fb923c]" : "h-4 w-4 text-gray-700"} fill={isFav ? "#fb923c" : "none"} />
                    </IconPill>
                    <IconPill
                        title={hasSustitutos ? "Ver productos sustitutos/sugeridos" : "Sin productos sustitutos"}
                        onClick={handleOpenSustitutos}
                        disabled={!hasSustitutos}
                    >
                        <ArrowLeftRight className={`h-4 w-4 ${hasSustitutos ? 'text-gray-700' : 'text-gray-300'}`} />
                    </IconPill>
                    <IconPill
                        title={hasRelacionados ? "Ver productos relacionados" : "Sin productos relacionados"}
                        onClick={handleOpenRelacionados}
                        disabled={!hasRelacionados}
                    >
                        <Link2 className={`h-4 w-4 ${hasRelacionados ? 'text-gray-700' : 'text-gray-300'}`} />
                    </IconPill>
                    <IconPill title="Aplicaciones por motocicleta" onClick={() => setAplicacionesModalOpen(true)}>
                        <Bike className="h-4 w-4 text-gray-700" />
                    </IconPill>
                    <Link
                        href={productUrl}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.location.href = productUrl
                        }}
                        className="h-9 w-9 rounded-full bg-white/90 backdrop-blur shadow-sm border border-white/60 flex items-center justify-center hover:bg-white transition-colors"
                        title="Detalle"
                    >
                        <Info className="h-4 w-4 text-gray-700" />
                    </Link>
                </div>

                {/* Imagen — más grande; empuja título y datos hacia la derecha */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-56 lg:h-56 flex-shrink-0 flex items-center justify-center cursor-pointer group rounded-xl border border-gray-100 bg-white overflow-hidden">
                    {/* Imagen principal */}
                    <div
                        className="w-full h-full flex items-center justify-center p-1.5 sm:p-2"
                        onClick={() => openGallery(currentImageIndex)}
                    >
                        {/* Spinner de carga */}
                        {loadingImg && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                                <div className="h-6 w-6 rounded-full border-2 border-[#001f3f] border-t-transparent animate-spin" />
                            </div>
                        )}
                        <img
                            key={`img-${currentImageIndex}-${mainImageUrl}`}
                            src={mainImageUrl || PRODUCT_PLACEHOLDER}
                            alt={product.descripcion}
                            className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${loadingImg ? 'opacity-0 z-0' : 'opacity-100 z-20'}`}
                            onLoad={() => setTimeout(() => setLoadingImg(false), 0)}
                            onError={(e) => {
                                const target = e.currentTarget
                                if (!target.src.endsWith(PRODUCT_PLACEHOLDER)) {
                                    target.src = PRODUCT_PLACEHOLDER
                                }
                                setLoadingImg(false)
                            }}
                        />
                    </div>

                    {/* Botones de navegación - solo visibles con hover */}
                    {hasMultipleImages && (
                        <>
                            <button
                                type="button"
                                onClick={prevImage}
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 bg-black/45 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity z-50"
                                title="Imagen anterior"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={nextImage}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 bg-black/45 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                title="Siguiente imagen"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Indicador de posición */}
                    {/* {hasMultipleImages && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 z-50">
                            <span>{currentImageIndex + 1}</span>
                            <span>/</span>
                            <span>{imageUrls.length}</span>
                        </div>
                    )} */}

                    {/* Dots de navegación */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                            {imageUrls.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setCurrentImageIndex(idx)
                                    }}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex
                                        ? 'bg-white scale-110'
                                        : 'bg-white/50 hover:bg-white/80'
                                        }`}
                                    title={`Imagen ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Información del producto — ocupa el resto del ancho hacia la derecha */}
                <div className="flex-1 min-w-0 flex flex-col pl-1 sm:pl-2 md:pl-4">
                    <div className="mb-1">
                        <NuevoProductBadge
                            visible={isProductoNuevo(product.nuevo)}
                            size="list"
                        />
                    </div>
                    {/* Marca / categoría */}
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#001f3f] uppercase mb-1">
                        {product.marca}
                    </span>

                    {/* Descripción */}
                    <Link href={productUrl}>
                        <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#001f3f] leading-snug mb-1 uppercase line-clamp-2 md:line-clamp-3">
                            {product.descripcion}
                        </h3>
                    </Link>

                    <p className="text-[10px] font-bold text-gray-500 mb-2">Cod: {product.tippro}{product.artcod}</p>

                    {presentaciones.length > 0 && (
                        <div className="mb-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
                            <div className="text-[11px] font-black text-gray-500 tracking-wide uppercase mb-1">
                                Presentación
                            </div>
                            <ul className="space-y-1 text-[11px] text-gray-700">
                                {(() => {
                                    const withBarcode = presentaciones.filter(
                                        (p: any) => (p?.codigoBarra ?? '').toString().trim().length > 0
                                    )
                                    const list = (withBarcode.length > 0 ? withBarcode : presentaciones).slice(0, 2)
                                    return list.map((p, idx) => (
                                        <li key={`${p.tipoEnvase ?? 'x'}-${idx}`} className="flex gap-2">
                                            <span className="text-gray-400">•</span>
                                            <span className="block"> 
                                                {unidadPresentacionLabel(p) ? ` ${unidadPresentacionLabel(p)}` : ''}
                                                {p.cantidad != null ? ` ${p.cantidad}` : ''}
                                                {product.unidadMedidaCatalogo ? ` ${product.unidadMedidaCatalogo}` : ''}
                                                {pesoPresentacionLabel(p) ? ` ${pesoPresentacionLabel(p)}` : ''}
                                            </span>
                                        </li>
                                    ))
                                })()}
                            </ul>
                        </div>
                    )}

                    {isLoggedIn ? (
                        <>
                            {/* Prices section - Vista detalle */}
                            <div className="flex flex-wrap gap-4 md:gap-6 items-center mt-auto md:justify-end">
                                {/* Precio Compra */}
                                {showPurchasePrice && (
                                    showPrecioPromocional ? (
                                        <OfertaPrecioDisplay
                                            oferta={ofertaPrecios}
                                            simboloMoneda={simboloMoneda}
                                            format={format}
                                            quantity={quantity}
                                            variant="list"
                                        />
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                {quantity > 1 ? `Total (${quantity} u.)` : (monedaAMostrar === 'USD' ? 'Precio Final USD:' : 'Precio Final:')}
                                            </span>
                                            <span className="text-[18px] font-black text-[#001f3f] leading-none">
                                                {simboloMoneda}{format(quantity > 1 ? precioVentaTotal : precioVentaUnitario)}
                                            </span>
                                            {quantity > 1 && (
                                                <span className="text-[10px] text-gray-400 font-bold">
                                                    Unit.: {simboloMoneda}{format(precioVentaUnitario)}
                                                </span>
                                            )}
                                            {bonificacion > 0 && tienePrecioListaVisible(precioListaMostrar, precioVentaUnitario) && (
                                                <span className="text-[10px] text-gray-400 line-through font-bold">
                                                    Lista: {simboloMoneda}{format(precioListaMostrar)}
                                                </span>
                                            )}
                                        </div>
                                    )
                                )}

                                {/* Precio Público (solo si hay % configurado) */}
                                {showPublicPrice && markupPercentage > 0 && (
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                                            Precio Público:
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[14px] font-bold text-[#fb923c]">
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

                                {ofertaCountdown.shouldShow && ofertaCountdown.pool && (
                                    <div className="w-full basis-full">
                                        <OfertaCountdownBanner
                                            pool={ofertaCountdown.pool}
                                            variant="detail"
                                            visible={isLoggedIn}
                                        />
                                    </div>
                                )}

                                {/* Stock por sucursal + acciones */}
                                <div className="flex gap-3 ml-auto items-start">
                                {isLoggedIn && (
                                    <div className="min-w-[160px]">
                                        {String(product.productoAPedido || '').toUpperCase() === 'S' ? (
                                            <p className="text-[11px] text-amber-700 font-semibold mb-2 text-right">
                                                Producto a pedido. Consultar por favor.
                                            </p>
                                        ) : null}
                                        <BranchStockDisplay
                                            userTipo={user?.tipo}
                                            verStock={user?.verStock}
                                            stockList={product.stock}
                                            stockNoa={product.stockNoa}
                                            stockNea={product.stockNea}
                                            stockBue={product.stockBue}
                                            stockCuy={product.stockCuy}
                                            variant="compact"
                                        />
                                        {(() => {
                                            const raw = product.proximoIngreso;
                                            if (!raw) return null;
                                            const d = new Date(raw);
                                            if (Number.isNaN(d.getTime())) return null;
                                            const label = d.toLocaleDateString('es-AR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            });
                                            return (
                                                <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-[11px] text-sky-900">
                                                    <span className="font-bold">Próximo ingreso: </span>
                                                    {label}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                                    {/* Botón agregar al carrito */}
                                    <div className="flex flex-col gap-2">
                                        {(user?.tipo === 'V' || user?.tipo === 'A' || user?.tipo === 'S' || user?.tipo === 'B') && (
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Bonificación %:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={bonif2}
                                                    disabled={isAdding || isRemoving || isUpdatingBonif2}
                                                    onChange={(e) => setBonif2FromUi(Number(e.target.value))}
                                                    className="w-16 h-7 border border-gray-200 rounded flex items-center justify-center font-bold text-[#e7000b] text-sm text-center outline-none focus:border-[#e7000b] disabled:opacity-50"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-gray-200 rounded">
                                                <button
                                                    type="button"
                                                    onClick={() => setQuantityFromUi(quantity - 1)}
                                                    disabled={isAdding || isRemoving || loading || isUpdatingQty}
                                                    className="px-2 py-1 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    disabled={isAdding || isRemoving || loading || isUpdatingQty}
                                                    onChange={(e) => setQuantityFromUi(parseInt(e.target.value, 10) || 1)}
                                                    className="w-12 text-center text-sm font-bold text-[#333333] focus:outline-none disabled:opacity-50"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setQuantityFromUi(quantity + 1)}
                                                    disabled={isAdding || isRemoving || loading || isUpdatingQty}
                                                    className="px-2 py-1 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
                                                disabled={isAdding || isRemoving || loading || isUpdatingQty}
                                                className={`h-8 ${isInCart ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#0056b3] hover:bg-[#004085]'} text-white rounded text-[11px] font-bold flex items-center justify-center gap-2 px-3 uppercase tracking-tight transition-colors disabled:opacity-50`}
                                            >
                                                {isAdding || isRemoving ? (
                                                    <Loader2 className="animate-spin" size={12} />
                                                ) : isInCart ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
                                                ) : (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                                    </svg>
                                                )}
                                                {isAdding ? 'Agregando...' : isRemoving ? 'Quitando...' : isInCart ? 'Quitar' : 'Agregar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="mt-auto py-2 border-2 border-dashed border-gray-100 rounded text-center">
                            <p className="text-[#001f3f] font-bold text-[10px] uppercase">Inicie sesión para ver precios</p>
                        </div>
                    )}
                </div>

            </li>

            {galleryOpen && (
                <ProductGalleryModal
                    images={images}
                    initialIndex={galleryIndex}
                    onClose={() => setGalleryOpen(false)}
                />
            )}

            <AplicacionesMotocicletaModal
                isOpen={aplicacionesModalOpen}
                onClose={() => setAplicacionesModalOpen(false)}
                aplicaciones={product.aplicaciones}
            />

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

            {/* Popup de alerta para markup */}
            <Modal isOpen={showMarkupAlert} onClose={() => setShowMarkupAlert(false)}>
                <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                        Markup no configurado
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                        Para mostrar el precio público, debe ingresar un porcentaje de markup en la barra de herramientas del catálogo.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-500 text-center">
                            Ingrese el porcentaje de markup en el campo "% markup" y el precio público se mostrará automáticamente con su porcentaje.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowMarkupAlert(false)}
                        className="w-full bg-[#001f3f] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#003366] transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </Modal>
        </>
    )
}

function IconPill({ title, children, onClick, disabled }: { title: string; children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            className={`h-8 w-8 rounded-full backdrop-blur shadow-sm border flex items-center justify-center transition-colors ${disabled
                ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                : 'bg-white/90 border-white/60 hover:bg-white'
                }`}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (disabled) return
                onClick?.()
            }}
        >
            {children}
        </button>
    )
}
